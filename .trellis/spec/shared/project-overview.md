# Project Overview

MoodShakerFront is a bilingual AI cocktail recommendation product built with
Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, external AI
providers, and Cloudflare R2 for generated-image storage.

## External Runtime Dependencies

| Dependency | Purpose | Failure mode |
| --- | --- | --- |
| OpenAI-compatible chat API | Recommendation generation | `POST /api/cocktail` returns an error; nothing is persisted |
| Image generation API | Cocktail imagery | `POST /api/image` returns `IMAGE_PROVIDER_FAILED`; nothing is persisted |
| Cloudflare R2 (S3 API) | Stores generated images; DB holds URLs only | `OBJECT_STORE_UNAVAILABLE`; `instrumentation.ts` warns at startup when unconfigured |
| PostgreSQL | Cocktails, recommendation sessions, rate-limit buckets | Data routes report an explicit unavailable state |

`sharp` is a required dependency, not optional: the image pipeline transcodes
before upload, so a silent fallback would only store worse data.

## Current Product Surface

- Localized `/cn` and `/en` app routes.
- Mood questionnaire and AI recommendation generation.
- AI image generation and refresh.
- Same-browser private recommendation recovery.
- Public cocktail gallery and detail pages.
- Share-card generation and download.
- Docker/release docs for controlled beta deployment.

## Important Boundaries

- Private recommendation access depends on local edit token state.
- `editToken` is never accepted in URLs and is not echoed back to clients.
- Rate-limit storage is shared through Postgres buckets where configured.
- Production readiness is still limited; `docs/release-readiness.md` remains
  authoritative for blockers.
- Automated coverage is lightweight; pair it with manual smoke checks for
  product-facing changes.

## Docker Image Size

`output: "standalone"` is not enabled, and enabling it is not a one-line change.

Measured by trying it: the build succeeds, the standalone tree is 104 MB against
644 MB of `node_modules`, and the standalone server serves every route including the
database-backed `/api/health` with the correct linux-musl Prisma engine bundled.

What blocks it is `scripts/docker-entrypoint.sh`, which runs `pnpm db:init` — that
needs the prisma CLI, tsx, and pnpm, none of which standalone bundles. Adopting
standalone means restructuring how migrations and seeding run at container start, and
verifying that needs a working Docker daemon.
