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

## Rate Limiting And Deployment

- Recommendation and image APIs emit rate-limit headers.
- `POST /api/cocktail` is currently rate-limited by client IP.
- `POST /api/image` is rate-limited per recommendation id.
- In production, missing shared rate-limit storage is a deployment error.
