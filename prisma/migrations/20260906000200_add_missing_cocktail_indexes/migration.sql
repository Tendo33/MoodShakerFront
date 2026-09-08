-- Create the three cocktail indexes the schema has always declared.
--
-- `@@index([baseSpirit])`, `@@index([alcoholLevel])`, and `@@index([createdAt])`
-- were in schema.prisma but no migration ever created them, so the database had
-- only the primary key. The same class of drift as the two migrations in
-- 20260905* that were written but never applied.
--
-- These back the gallery directly: filters compare `base_spirit` and
-- `alcohol_level`, and keyset pagination orders by `(created_at, id)`.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_cocktail_base_spirit" ON "cocktails"("base_spirit");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_cocktail_alcohol_level" ON "cocktails"("alcohol_level");

-- Descending to match `ORDER BY created_at DESC, id DESC` in getGalleryCocktails.
-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_cocktail_created_at" ON "cocktails"("created_at" DESC, "id" DESC);
