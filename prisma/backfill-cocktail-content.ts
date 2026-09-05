/**
 * Backfills `slug` and `content` from the legacy column pairs.
 *
 * Run after `20260906000000_add_cocktail_slug_content` and before
 * `20260906000100_drop_legacy_cocktail_columns`. Idempotent: rows that already
 * have both columns are skipped, so a partial run can be repeated.
 *
 *   pnpm prisma:backfill-cocktail-content            # apply
 *   pnpm prisma:backfill-cocktail-content -- --dry   # report only
 */
import { PrismaClient } from "@prisma/client";
import {
  coerceAlcoholLevel,
  coerceBaseSpirit,
  coerceFlavorProfiles,
} from "../lib/domain/vocabulary";
import { fromLegacyPair, type LocalizedText } from "../lib/i18n/localized";

const prisma = new PrismaClient({ log: ["warn", "error"] });
const dryRun = process.argv.includes("--dry");

interface LegacyRow {
  id: string;
  name: string;
  english_name: string | null;
  description: string;
  english_description: string | null;
  match_reason: string | null;
  english_match_reason: string | null;
  base_spirit: string;
  alcohol_level: string;
  serving_glass: string;
  english_serving_glass: string | null;
  time_required: string;
  english_time_required: string | null;
  flavor_profiles: string[];
  ingredients: unknown;
  tools: unknown;
  steps: unknown;
  slug: string | null;
  content: unknown;
}

/**
 * Builds a URL slug.
 *
 * Prefers the English name because a percent-encoded Chinese URL is unreadable
 * and breaks when copied between clients. Rows whose id is already a slug — the
 * three seeded classics use `mojito`, `margarita`, `cosmopolitan` as their
 * primary key — keep that value so existing links keep resolving.
 */
function buildSlug(row: LegacyRow): string {
  const isAlreadySlug = !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(row.id);
  if (isAlreadySlug) return row.id;

  const source = row.english_name?.trim() || row.name.trim();
  const slug = source
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // A Chinese-only name transliterates to nothing usable; fall back to the id so
  // the row still gets a stable, unique slug.
  return slug.length > 0 ? slug : `cocktail-${row.id.slice(0, 8)}`;
}

/** Reads a possibly-bilingual value out of a nested JSON entry. */
function nestedPair(
  entry: Record<string, unknown>,
  key: string,
): LocalizedText | null {
  const cn = entry[key];
  const en = entry[`english_${key}`];
  return fromLegacyPair(
    typeof cn === "string" ? cn : null,
    typeof en === "string" ? en : null,
  );
}

function mapIngredients(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw) => {
    if (typeof raw !== "object" || raw === null) return [];
    const entry = raw as Record<string, unknown>;

    const name = nestedPair(entry, "name");
    const amount = nestedPair(entry, "amount");
    if (!name) return [];

    return [
      {
        name,
        amount: amount ?? { cn: "", en: "" },
        unit: nestedPair(entry, "unit"),
        substitute: nestedPair(entry, "substitute"),
      },
    ];
  });
}

function mapTools(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw) => {
    if (typeof raw !== "object" || raw === null) return [];
    const entry = raw as Record<string, unknown>;

    const name = nestedPair(entry, "name");
    if (!name) return [];

    return [{ name, alternative: nestedPair(entry, "alternative") }];
  });
}

function mapSteps(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw, index) => {
    if (typeof raw !== "object" || raw === null) return [];
    const entry = raw as Record<string, unknown>;

    const description = nestedPair(entry, "description");
    if (!description) return [];

    const stored = entry.step_number;
    const stepNumber =
      typeof stored === "number" && Number.isFinite(stored) && stored > 0
        ? stored
        : index + 1;

    return [{ stepNumber, description, tips: nestedPair(entry, "tips") }];
  });
}

function buildContent(row: LegacyRow) {
  return {
    name: fromLegacyPair(row.name, row.english_name),
    description: fromLegacyPair(row.description, row.english_description),
    matchReason: fromLegacyPair(row.match_reason, row.english_match_reason),
    servingGlass: fromLegacyPair(row.serving_glass, row.english_serving_glass),
    timeRequired: fromLegacyPair(row.time_required, row.english_time_required),
    ingredients: mapIngredients(row.ingredients),
    tools: mapTools(row.tools),
    steps: mapSteps(row.steps),
  };
}

async function main() {
  const rows = await prisma.$queryRaw<LegacyRow[]>`
    SELECT id, name, english_name, description, english_description,
           match_reason, english_match_reason, base_spirit, alcohol_level,
           serving_glass, english_serving_glass, time_required,
           english_time_required, flavor_profiles, ingredients, tools, steps,
           slug, content
    FROM cocktails
    ORDER BY created_at`;

  console.log(`Rows: ${rows.length}${dryRun ? " (dry run)" : ""}`);

  const taken = new Set(
    rows.map((r) => r.slug).filter((s): s is string => Boolean(s)),
  );
  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.slug && row.content) {
      skipped += 1;
      continue;
    }

    let slug = row.slug ?? buildSlug(row);

    // Two rows legitimately share the name 沙漠电台, and `name` never actually
    // carried a unique constraint despite the schema claiming one. Suffix
    // collisions rather than failing the run.
    if (!row.slug && taken.has(slug)) {
      let suffix = 2;
      while (taken.has(`${slug}-${suffix}`)) suffix += 1;
      slug = `${slug}-${suffix}`;
    }
    taken.add(slug);

    const content = buildContent(row);
    const baseSpirit = coerceBaseSpirit(row.base_spirit);
    const alcoholLevel = coerceAlcoholLevel(row.alcohol_level);
    const flavorProfiles = coerceFlavorProfiles(row.flavor_profiles);

    if (dryRun) {
      console.log(
        `  ${row.name} -> slug=${slug} spirit=${baseSpirit} ` +
          `alc=${alcoholLevel} flav=[${flavorProfiles.join(",")}] ` +
          `ing=${content.ingredients.length} steps=${content.steps.length}`,
      );
      migrated += 1;
      continue;
    }

    await prisma.$executeRaw`
      UPDATE cocktails
      SET slug = ${slug},
          content = ${content}::jsonb,
          base_spirit = ${baseSpirit},
          alcohol_level = ${alcoholLevel},
          flavor_profiles = ${flavorProfiles},
          updated_at = now()
      WHERE id = ${row.id}`;

    migrated += 1;
  }

  console.log(`Migrated: ${migrated}, skipped: ${skipped}`);

  if (!dryRun) {
    const remaining = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM cocktails WHERE slug IS NULL OR content IS NULL`;
    console.log(`Rows still missing slug or content: ${remaining[0].n}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
