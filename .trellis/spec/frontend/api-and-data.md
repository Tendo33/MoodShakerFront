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
  `editToken` in the JSON body.

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
