# API And Data

MoodShaker uses Next.js route handlers plus Prisma/PostgreSQL.

## Route Handlers

- `POST /api/cocktail` generates a cocktail recommendation from questionnaire
  input.
- `GET /api/cocktail/:id` fetches public cocktail detail data.
- `POST /api/image` generates or refreshes a recommendation image when the
  caller has edit access. Body is `{ recommendationId, editToken }` only;
  returns `{ imageUrl, thumbnailUrl }`.
- `POST /api/recommendation/:id` retrieves a private recommendation using
  `editToken` in the JSON body. The response includes `meta.isPublished` and
  `meta.publishedSlug` so a client knows which action to offer.
- `POST /api/recommendation/:id/publish` publishes a recommendation to the public
  gallery. `DELETE` on the same path withdraws it. Both take `editToken` in the
  body, never the URL.

## Publish Loop

- `RecommendationStatus.PUBLISHED` and `publishedCocktailId` existed in the schema
  from the beginning with nothing ever writing them, so every recommendation stayed
  `PRIVATE` and the gallery could only show rows from the seed script.
  `lib/publish-cocktail.ts` is the write path that closes this.
- Access is enforced in the SQL `WHERE` clause on `edit_token`, not a separate
  check, so a caller cannot publish or withdraw someone else's recommendation. An
  unknown id and a wrong token both return `NOT_FOUND` — distinguishing them turns
  the endpoint into an id oracle.
- Publishing is idempotent: a second call returns the existing cocktail with
  `alreadyPublished: true` rather than creating a duplicate. `SELECT … FOR UPDATE`
  serializes concurrent publishes of the same recommendation.
- Withdrawal must exist before a publish button ships. Publishing without it is a
  one-way door.
- Both operations set an explicit transaction budget
  (`maxWait: 15s, timeout: 30s`). Prisma's defaults are 2 s and 5 s, and publishing
  does four round trips against a Neon instance that suspends when idle — on the
  defaults the transaction is discarded mid-flight and the caller sees
  `Transaction not found`, which reads like a bug rather than a timeout.
- Any write to the published set must call `revalidatePath` for both locales'
  gallery, the affected cocktail page, and `/sitemap.xml`. Without it a publish
  changes nothing a visitor sees and a withdrawal leaves the public page serving a
  deleted row. Verified by end-to-end HTTP test, not by inspection.

## Gallery Search

- Search matches a concatenation of every locale's name and description, so a
  Chinese query finds a drink while the interface is in English. Per-locale search
  missed that in both directions.
- The match is indexed by a `pg_trgm` GIN expression index
  (`20260906000300_add_cocktail_search_index`). `lib/cocktail-data.ts` holds the
  same expression in `SEARCH_EXPRESSION` and the two must stay
  character-for-character identical — the planner matches an expression index by the
  expression itself, so any difference silently falls back to a full table scan.
  Verify with `EXPLAIN` under `SET enable_seqscan = off`; on a small table Postgres
  will choose a sequential scan regardless, so a plain `EXPLAIN` proves nothing.
- Not Postgres full-text search: `to_tsvector` cannot segment Chinese without a
  parser extension and Neon offers none. Measured on this database,
  `to_tsvector('simple', '莫吉托清爽的古巴经典')` yields a single token, so a search
  for 莫吉 never matches. Trigrams need no word boundaries.
- Filter options in the UI come from `lib/domain/vocabulary.ts`, never a local copy.
  Three hand-written arrays of display text (`"Gin"`, `"Sweet"`, `"Low"`) meant
  every filter click was validated against the vocabulary, rejected, and silently
  dropped — the gallery returned everything — and the lists had drifted to 9 of 12
  flavours and 3 of 4 strengths, so some drinks could not be filtered for at all.

## Image Generation Contract

- The image prompt is derived server-side from the stored cocktail payload by
  `lib/ai/image-prompt.ts`, which is `server-only`.
- A request body carrying `prompt` is **rejected with 400**, not ignored. Passing
  a caller-supplied prompt through to the provider turned this route into an open
  text-to-image proxy on the project's API key.
- Client components must not import `lib/ai/**`, `lib/storage/**`, or
  `lib/db/**`. The `server-only` marker makes such an import fail the build.
- Images are stored in Cloudflare R2 under content-addressed keys; the database
  holds URLs, never base64 payloads.
- Failure semantics and error codes: see
  [image-provider-failures.md](../big-question/image-provider-failures.md).

## Privacy And Access

- `editToken` must not appear in URLs.
- Private recommendation responses must not echo `editToken`.
- `POST` routes verify `Origin` when the header is present.
- Rate limiting resolves the client IP through `TRUSTED_PROXY_HOPS`; the
  left-most `x-forwarded-for` entry is attacker-controlled and must not be used.
- Same-browser recovery depends on local metadata and local edit access.
- Missing private access should produce an explicit unavailable state, not a
  silent failure.

## Prisma Models

- `Cocktail` stores public cocktail catalog/detail data.
- `RecommendationSession` stores private recommendation payload, edit token,
  language, agent type, answers, generated image, publication status, and an
  optional published cocktail relation.
- `RateLimitBucket` stores shared rate-limit counters.
- Schema changes require Prisma migration and `pnpm db:init` validation.

### Cocktail Content Shape

- Free text lives in the `content` JSONB column, keyed by locale
  (`{ name: { cn, en }, ... }`). There are no `english_*` columns; adding a third
  language is a data change, not a schema change.
- `baseSpirit`, `alcoholLevel`, and `flavorProfiles` are stored as vocabulary
  codes from `lib/domain/vocabulary.ts`, never as display text. They stay as
  columns so they remain indexable.
- `RecommendationSession.cocktailPayload` stores the same bilingual shape, so one
  recommendation renders in either locale.
- `slug` is the public identifier and is unique. `name` carries no uniqueness
  constraint: two drinks may legitimately share a name.

### Locale Resolution

- `lib/domain/resolve-cocktail.ts` is the only place stored content is resolved to
  one language. Database reads and freshly generated recommendations both pass
  through it.
- Components receive plain strings and must not choose between locales
  themselves. A component that deliberately shows two languages at once reads
  `nameAllLocales`.
- Vocabulary fields reach the UI twice: the code for filtering and comparison,
  the `*Label` for display. Filtering on a label is a defect.

### Migration Shape

- Column-shape changes go out as expand → backfill → contract, in separate
  migrations: add nullable columns, run a backfill script, then require the new
  columns and drop the old ones.
- A contract migration must refuse to run when rows are unmigrated, rather than
  dropping data the backfill has not copied.
- Backfill scripts are idempotent and support `-- --dry`.
- Verify migrations were actually applied against the target database. A schema
  file is not evidence: this project shipped with two migrations that existed but
  had never run, and three indexes declared but never created.

## Rate Limiting And Deployment

- Recommendation and image APIs emit rate-limit headers.
- `POST /api/cocktail` is currently rate-limited by client IP.
- `POST /api/image` is rate-limited per recommendation id.
- In production, missing shared rate-limit storage is a deployment error.
