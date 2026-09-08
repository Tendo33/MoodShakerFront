-- Expand phase: add object-storage URL columns alongside the legacy inline
-- image columns. Purely additive and safe to roll back with DROP COLUMN.
--
-- The legacy `image` / `thumbnail` columns stay in place during the dual-read
-- window and are dropped in a later batch, after the backfill is verified.

-- AlterTable
ALTER TABLE "cocktails" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "thumbnail_url" TEXT;

-- AlterTable
ALTER TABLE "recommendation_sessions" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "thumbnail_url" TEXT;
