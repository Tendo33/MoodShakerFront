-- Contract phase: require the new columns and drop the ones they replace.
--
-- IRREVERSIBLE. Run only after `prisma/backfill-cocktail-content.ts` reports zero
-- rows missing `slug` or `content`. The expand migration
-- (20260906000000_add_cocktail_slug_content) plus the backfill are safe to deploy
-- on their own; this one is the point of no return.
--
-- Drops 18 columns and leaves 10. Eight of the dropped columns were the
-- `english_*` half of a pair, and each read site had to choose between the two by
-- hand — a hook only client components could call, so server components silently
-- rendered Chinese. Free text now lives in `content` as `{ cn, en }`, which also
-- means a third language needs no schema change.

-- Fail loudly rather than dropping data the backfill has not copied yet.
DO $$
DECLARE
  unmigrated integer;
BEGIN
  SELECT count(*) INTO unmigrated
  FROM "cocktails"
  WHERE "slug" IS NULL OR "content" IS NULL;

  IF unmigrated > 0 THEN
    RAISE EXCEPTION
      'Refusing to drop legacy columns: % row(s) still lack slug or content. Run: pnpm prisma:backfill-cocktail-content',
      unmigrated;
  END IF;
END $$;

-- Replace the partial index from the expand phase with a real constraint.
DROP INDEX IF EXISTS "cocktails_slug_key_partial";

ALTER TABLE "cocktails" ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "flavor_profiles" SET NOT NULL;

CREATE UNIQUE INDEX "cocktails_slug_key" ON "cocktails"("slug");

-- Indexed the English half of a pair that no longer exists.
DROP INDEX IF EXISTS "idx_cocktail_english_name";

-- `name` carried a UNIQUE constraint in the Prisma schema that the database never
-- actually had; two rows already shared the name 沙漠电台. Uniqueness belongs on
-- the URL identifier, which is what the index above enforces.
ALTER TABLE "cocktails" DROP COLUMN "name",
DROP COLUMN "english_name",
DROP COLUMN "description",
DROP COLUMN "english_description",
DROP COLUMN "match_reason",
DROP COLUMN "english_match_reason",
DROP COLUMN "english_base_spirit",
DROP COLUMN "english_alcohol_level",
DROP COLUMN "serving_glass",
DROP COLUMN "english_serving_glass",
DROP COLUMN "time_required",
DROP COLUMN "english_time_required",
DROP COLUMN "english_flavor_profiles",
DROP COLUMN "ingredients",
DROP COLUMN "tools",
DROP COLUMN "steps",
-- Base64 image data stored inline in the row, superseded by image_url /
-- thumbnail_url in migration 20260905000100 and backfilled since.
DROP COLUMN "image",
DROP COLUMN "thumbnail";
