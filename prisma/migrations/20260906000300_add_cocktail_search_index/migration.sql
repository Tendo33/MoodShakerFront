-- Make gallery search use an index instead of scanning every row.
--
-- Search matches free text that lives inside the `content` JSONB column, across
-- every locale, with `ILIKE '%query%'`. A leading wildcard cannot use a B-tree
-- index, and the previous query wrapped each field in `jsonb_each_text(...)` — a
-- lateral join, which is not indexable at all. Every search read the whole table.
--
-- Why trigrams rather than Postgres full-text search: `to_tsvector` cannot segment
-- Chinese without a parser extension, and Neon offers none (no zhparser, no
-- pgroonga). Measured on this database:
--
--   to_tsvector('simple', '莫吉托清爽的古巴经典')  =>  '莫吉托清爽的古巴经典':1
--
-- The whole string becomes one token, so a search for 莫吉 never matches. `pg_trgm`
-- indexes character trigrams and needs no word boundaries, which is why it works
-- for both languages here: similarity('莫吉托', '莫吉') = 0.4.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- An expression index rather than a generated column: Prisma 5 cannot express a
-- generated column, and adding one out-of-band would show up as permanent schema
-- drift — the same class of problem as the three indexes this project declared but
-- never created.
--
-- `getGalleryCocktails` must build the identical expression for the planner to use
-- this index. Both sides are locale-agnostic on purpose: a Chinese query should
-- find a drink while the interface is in English, which the per-locale search it
-- replaces could not do.
CREATE INDEX IF NOT EXISTS "idx_cocktail_search_trgm" ON "cocktails"
USING gin (
  (
    coalesce("content"->'name'->>'cn', '') || ' ' ||
    coalesce("content"->'name'->>'en', '') || ' ' ||
    coalesce("content"->'description'->>'cn', '') || ' ' ||
    coalesce("content"->'description'->>'en', '')
  ) gin_trgm_ops
);
