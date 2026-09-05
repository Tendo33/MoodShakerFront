/**
 * Migrates legacy inline images to object storage.
 *
 * Resumable and idempotent: rows that already have `image_url` are skipped, and
 * object keys are content-addressed, so a re-run overwrites the same objects
 * rather than accumulating duplicates. A failure on one row is recorded and the
 * scan continues.
 *
 * The `image` column holds three different shapes in practice, each handled
 * differently:
 *
 *   data:image/...;base64,...   decode, transcode, upload
 *   https://<provider-cdn>/...  download and upload; clear the row when the
 *                               link is dead, which most of them are
 *   /local-asset.png            left untouched — these are seed assets served
 *                               from `public/`, they are short strings, and they
 *                               are not what this migration exists to fix
 *
 * Usage:
 *   pnpm prisma:backfill-image-urls            apply
 *   pnpm prisma:backfill-image-urls --dry-run  report without writing
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const PAGE_SIZE = 20;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

const prisma = new PrismaClient({ log: [] });
const dryRun = process.argv.includes("--dry-run");

interface StoreConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

function readConfig(): StoreConfig {
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "R2_PUBLIC_BASE_URL",
  ] as const;

  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Object storage is not configured. Missing: ${missing.join(", ")}`,
    );
  }

  return {
    accountId: String(process.env.R2_ACCOUNT_ID),
    accessKeyId: String(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: String(process.env.R2_SECRET_ACCESS_KEY),
    bucket: String(process.env.R2_BUCKET),
    publicBaseUrl: String(process.env.R2_PUBLIC_BASE_URL).replace(/\/+$/, ""),
  };
}

const config = readConfig();

const client = new S3Client({
  region: "auto",
  endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

type SourceKind = "base64" | "remote" | "local" | "empty";

function classify(image: string | null): SourceKind {
  if (!image || image.trim().length === 0) return "empty";
  if (image.startsWith("data:")) return "base64";
  if (image.startsWith("http://") || image.startsWith("https://")) return "remote";
  return "local";
}

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const parts = dataUrl.split(",");
  if (parts.length !== 2 || !parts[1]) return null;
  try {
    return Buffer.from(parts[1], "base64");
  } catch {
    return null;
  }
}

async function downloadBuffer(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_SOURCE_BYTES) return null;
    return Buffer.from(bytes);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function uploadVariants(
  scope: string,
  id: string,
  source: Buffer,
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  const [full, thumb] = await Promise.all([
    sharp(source)
      .rotate()
      .resize({ width: 1024, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 80 })
      .toBuffer(),
    sharp(source)
      .rotate()
      .resize({ width: 320, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 60 })
      .toBuffer(),
  ]);

  const digest = createHash("sha256").update(full).digest("hex").slice(0, 16);
  const keyFor = (variant: "full" | "thumb") =>
    `${scope}/${id}/${digest}-${variant}.webp`;

  await Promise.all(
    (
      [
        [keyFor("full"), full],
        [keyFor("thumb"), thumb],
      ] as const
    ).map(([key, body]) =>
      client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      ),
    ),
  );

  return {
    imageUrl: `${config.publicBaseUrl}/${keyFor("full")}`,
    thumbnailUrl: `${config.publicBaseUrl}/${keyFor("thumb")}`,
  };
}

interface Stats {
  scanned: number;
  migrated: number;
  clearedDeadLinks: number;
  skippedLocal: number;
  skippedAlreadyDone: number;
  skippedEmpty: number;
  failed: string[];
}

function emptyStats(): Stats {
  return {
    scanned: 0,
    migrated: 0,
    clearedDeadLinks: 0,
    skippedLocal: 0,
    skippedAlreadyDone: 0,
    skippedEmpty: 0,
    failed: [],
  };
}

interface Row {
  id: string;
  image: string | null;
  imageUrl: string | null;
}

async function processRow(
  scope: "cocktails" | "recommendations",
  row: Row,
  stats: Stats,
  clear: (id: string) => Promise<void>,
  write: (id: string, urls: { imageUrl: string; thumbnailUrl: string }) => Promise<void>,
): Promise<void> {
  stats.scanned += 1;

  // Resumability: a populated imageUrl means this row is done.
  if (row.imageUrl) {
    stats.skippedAlreadyDone += 1;
    return;
  }

  const kind = classify(row.image);

  if (kind === "empty") {
    stats.skippedEmpty += 1;
    return;
  }

  if (kind === "local") {
    stats.skippedLocal += 1;
    return;
  }

  try {
    const source =
      kind === "base64"
        ? dataUrlToBuffer(row.image as string)
        : await downloadBuffer(row.image as string);

    if (!source) {
      // Unreachable remote images are cleared so the UI can fall back to its
      // placeholder and the user can regenerate. Keeping a known-dead URL only
      // guarantees a broken image.
      if (kind === "remote") {
        if (!dryRun) await clear(row.id);
        stats.clearedDeadLinks += 1;
        console.log(`  cleared dead link  ${row.id}`);
        return;
      }
      stats.failed.push(`${row.id} (undecodable base64)`);
      return;
    }

    if (dryRun) {
      stats.migrated += 1;
      console.log(`  would migrate      ${row.id} (${kind}, ${source.length}B)`);
      return;
    }

    const urls = await uploadVariants(scope, row.id, source);
    await write(row.id, urls);
    stats.migrated += 1;
    console.log(`  migrated           ${row.id} (${kind})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    stats.failed.push(`${row.id} (${message})`);
    console.log(`  FAILED             ${row.id}: ${message}`);
  }
}

async function backfillCocktails(): Promise<Stats> {
  const stats = emptyStats();
  let cursor: string | undefined;

  for (;;) {
    const page = await prisma.cocktail.findMany({
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, image: true, imageUrl: true },
    });

    if (page.length === 0) break;

    for (const row of page) {
      await processRow(
        "cocktails",
        row,
        stats,
        async (id) => {
          await prisma.cocktail.update({
            where: { id },
            data: { image: null, thumbnail: null },
          });
        },
        async (id, urls) => {
          await prisma.cocktail.update({
            where: { id },
            data: {
              imageUrl: urls.imageUrl,
              thumbnailUrl: urls.thumbnailUrl,
              image: null,
              thumbnail: null,
            },
          });
        },
      );
    }

    cursor = page[page.length - 1]?.id;
  }

  return stats;
}

async function backfillRecommendations(): Promise<Stats> {
  const stats = emptyStats();
  let cursor: string | undefined;

  for (;;) {
    const page = await prisma.recommendationSession.findMany({
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, image: true, imageUrl: true },
    });

    if (page.length === 0) break;

    for (const row of page) {
      await processRow(
        "recommendations",
        row,
        stats,
        async (id) => {
          await prisma.recommendationSession.update({
            where: { id },
            data: { image: null, thumbnail: null },
          });
        },
        async (id, urls) => {
          await prisma.recommendationSession.update({
            where: { id },
            data: {
              imageUrl: urls.imageUrl,
              thumbnailUrl: urls.thumbnailUrl,
              image: null,
              thumbnail: null,
            },
          });
        },
      );
    }

    cursor = page[page.length - 1]?.id;
  }

  return stats;
}

function report(label: string, stats: Stats): void {
  console.log(`\n${label}`);
  console.log(`  scanned              ${stats.scanned}`);
  console.log(`  migrated             ${stats.migrated}`);
  console.log(`  cleared dead links   ${stats.clearedDeadLinks}`);
  console.log(`  skipped (local path) ${stats.skippedLocal}`);
  console.log(`  skipped (done)       ${stats.skippedAlreadyDone}`);
  console.log(`  skipped (no image)   ${stats.skippedEmpty}`);
  console.log(`  failed               ${stats.failed.length}`);
  for (const failure of stats.failed) {
    console.log(`    - ${failure}`);
  }
}

async function main(): Promise<void> {
  console.log(
    dryRun
      ? "Dry run — no database writes, no uploads.\n"
      : `Backfilling into bucket "${config.bucket}".\n`,
  );

  console.log("cocktails:");
  const cocktails = await backfillCocktails();
  console.log("\nrecommendation_sessions:");
  const recommendations = await backfillRecommendations();

  report("cocktails", cocktails);
  report("recommendation_sessions", recommendations);

  const failures = cocktails.failed.length + recommendations.failed.length;
  if (failures > 0) {
    console.log(`\nCompleted with ${failures} failure(s). Re-run to retry.`);
    process.exitCode = 1;
    return;
  }

  console.log("\nCompleted with no failures.");
}

main()
  .catch((error) => {
    console.error("Backfill aborted:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
