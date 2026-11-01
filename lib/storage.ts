import "server-only";

import { createHash } from "node:crypto";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { whitenBackground } from "@/lib/image-levels";

/**
 * Generated images are downloaded from the provider's short-lived URL,
 * transcoded to WebP and stored in R2. Keys are content-addressed, which is what
 * makes the immutable Cache-Control safe: a regenerated image gets a new URL.
 */

const FETCH_TIMEOUT_MS = 15_000;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export class StorageError extends Error {
  constructor(
    readonly stage: "config" | "fetch" | "process" | "upload",
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

function readConfig(): R2Config {
  const values = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  };
  const missing = Object.entries(values).filter(([, value]) => !value?.trim());
  if (missing.length > 0) {
    throw new StorageError("config", `R2 is not configured: ${missing.map(([k]) => k).join(", ")}`);
  }
  return { ...(values as R2Config), publicBaseUrl: values.publicBaseUrl!.replace(/\/+$/, "") };
}

let client: { config: R2Config; aws: AwsClient } | null = null;

function getClient() {
  const config = readConfig();
  if (!client || client.config.accessKeyId !== config.accessKeyId || client.config.bucket !== config.bucket) {
    client = {
      config,
      aws: new AwsClient({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        service: "s3",
        region: "auto",
      }),
    };
  }
  return client;
}

function objectUrl(config: R2Config, key: string): string {
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
}

/** The image provider's delivery hosts (SiliconFlow serves results from these OSS buckets). */
const DEFAULT_SOURCE_HOSTS = [
  "s3.siliconflow.cn",
  "bizyair-prod.oss-cn-shanghai.aliyuncs.com",
  "sc-maas.oss-cn-shanghai.aliyuncs.com",
];

/** Only hosts we expect the image provider to hand back. The URL never comes from a user. */
function isAllowedSourceUrl(raw: string): boolean {
  const hosts = new Set(DEFAULT_SOURCE_HOSTS);
  for (const host of (process.env.IMAGE_FETCH_HOST_ALLOWLIST ?? "").split(",")) {
    if (host.trim()) hosts.add(host.trim());
  }
  try {
    if (process.env.IMAGE_API_URL) hosts.add(new URL(process.env.IMAGE_API_URL).hostname);
    const url = new URL(raw);
    return url.protocol === "https:" && hosts.has(url.hostname);
  } catch {
    return false;
  }
}

async function download(url: string): Promise<Buffer> {
  if (!isAllowedSourceUrl(url)) throw new StorageError("fetch", `Image host not allowed: ${url}`);

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (error) {
    throw new StorageError("fetch", error instanceof Error ? error.message : "download failed");
  }
  if (!response.ok) throw new StorageError("fetch", `Image download failed: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_SOURCE_BYTES) throw new StorageError("fetch", "Image too large.");
  return buffer;
}

async function put(key: string, body: Buffer): Promise<string> {
  const { config, aws } = getClient();
  const response = await aws.fetch(objectUrl(config, key), {
    method: "PUT",
    body: new Uint8Array(body),
    // Explicit: R2 answers 411 when the body arrives chunked, which happened
    // intermittently through Next's patched fetch.
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new StorageError("upload", `R2 upload failed: ${response.status}`);
  return `${config.publicBaseUrl}/${key}`;
}

/** Throws when R2 is not configured. Call before paying for an image that could not be stored. */
export function assertStorageConfigured(): void {
  getClient();
}

/** Downloads, transcodes and uploads both sizes. Rejects rather than returning a temporary URL. */
export async function storeImage(drinkId: string, sourceUrl: string) {
  const source = await whitenBackground(await download(sourceUrl));

  let full: Buffer;
  let thumb: Buffer;
  try {
    const resize = (width: number, quality: number) =>
      sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
    [full, thumb] = await Promise.all([resize(1024, 80), resize(400, 65)]);
  } catch (error) {
    throw new StorageError("process", error instanceof Error ? error.message : "transcode failed");
  }

  const digest = createHash("sha256").update(full).digest("hex").slice(0, 16);
  const [imageUrl, thumbnailUrl] = await Promise.all([
    put(`drinks/${drinkId}/${digest}-full.webp`, full),
    put(`drinks/${drinkId}/${digest}-thumb.webp`, thumb),
  ]);
  return { imageUrl, thumbnailUrl };
}

/** Best effort: a leftover object costs a little storage, a thrown error would fail a finished request. */
export async function deleteImages(urls: (string | null)[]): Promise<void> {
  let current: ReturnType<typeof getClient>;
  try {
    current = getClient();
  } catch {
    return;
  }
  const prefix = `${current.config.publicBaseUrl}/`;

  await Promise.all(
    urls
      .filter((url): url is string => Boolean(url?.startsWith(prefix)))
      .map((url) =>
        current.aws
          .fetch(objectUrl(current.config, url.slice(prefix.length)), { method: "DELETE" })
          .catch(() => undefined),
      ),
  );
}
