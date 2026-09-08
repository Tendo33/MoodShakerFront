-- Expand phase: add `slug` and `content` alongside the columns they replace.
--
-- Purely additive. Both columns are nullable here so this migration can be
-- deployed before the backfill runs; `20260906000100_drop_legacy_cocktail_columns`
-- makes them required and removes the old columns once the backfill is verified.
--
-- `content` holds locale-keyed free text — name, description, matchReason,
-- servingGlass, timeRequired, ingredients, tools, steps — replacing eight
-- `xxx` / `english_xxx` column pairs. The three closed vocabularies
-- (base_spirit, alcohol_level, flavor_profiles) stay as columns so they remain
-- indexable, but switch from display text to codes.

-- AlterTable
ALTER TABLE "cocktails" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "content" JSONB;

-- A partial unique index lets rows without a slug coexist during the backfill.
-- Replaced by a plain UNIQUE constraint in the contract migration.
CREATE UNIQUE INDEX "cocktails_slug_key_partial" ON "cocktails"("slug")
WHERE "slug" IS NOT NULL;
