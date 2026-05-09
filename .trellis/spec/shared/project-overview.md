# Project Overview

MoodShakerFront is a bilingual AI cocktail recommendation product built with
Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, and external AI
providers.

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
