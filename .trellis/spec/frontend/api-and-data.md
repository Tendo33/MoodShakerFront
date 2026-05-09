# API And Data

MoodShaker uses Next.js route handlers plus Prisma/PostgreSQL.

## Route Handlers

- `POST /api/cocktail` generates a cocktail recommendation from questionnaire
  input.
- `GET /api/cocktail/:id` fetches public cocktail detail data.
- `POST /api/image` generates or refreshes a recommendation image when the
  caller has edit access.
- `POST /api/recommendation/:id` retrieves a private recommendation using
  `editToken` in the JSON body.

## Privacy And Access

- `editToken` must not appear in URLs.
- Private recommendation responses must not echo `editToken`.
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
