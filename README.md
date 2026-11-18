# MoodShaker

[中文](./README.zh.md)

A bilingual (`/cn`, `/en`) AI bartender. Answer four questions — your mood tonight, how strong, what's on your shelf, classic or creative — and get a complete recipe written for you, a photograph of the drink, and a menu card to take home. Drinks you like can go on the public menu.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM + PostgreSQL · Zod · any OpenAI-compatible chat and image API · Cloudflare R2

## Running locally

```bash
pnpm install
cp .env.example .env            # fill in the API keys and DATABASE_URL
pnpm db:init                    # migrations + seed classics
pnpm dev
```

`pnpm test` runs the unit tests, `pnpm test:e2e` the Playwright smoke test, `pnpm typecheck` and `pnpm lint` the static checks.

Two scripts call the real models and cost a little money each run:

- `pnpm eval:recipes [n …]` pours eight contrasting orders and prints the recipes side by side, with timing and any repair turn. Run it after every change to `lib/ai/prompts.ts` or the model.
- `pnpm seeds:build [n …]` regenerates the seed menu (recipes and photographs) into `scripts/seed-data.ts` and `public/drinks/`.

## How it fits together

```
app/[lang]/              pages: home, questions, gallery, cocktail/[slug] (public), drink/[id] (private)
app/api/drinks/          POST pour · [id] read · [id]/image · [id]/publish (POST / DELETE)
lib/domain/              vocabulary codes, recipe schema (zod), order schema, slugs
lib/ai/                  provider calls, prompts, generation with one repair turn
lib/db/                  drizzle schema, drink queries, Postgres rate limiter
lib/storage.ts           image download → WebP → R2
lib/dictionaries/        cn / en strings, checked against one interface
proxy.ts                 locale redirect + per-request CSP nonce
drizzle/                 versioned SQL migrations
```

Rules the code holds to:

- **One recipe definition.** `lib/domain/recipe.ts` is the stored shape, every text field in both languages. The model writes the recipe twice, once per language (`lib/ai/draft.ts`); the server checks the two line up, that the Chinese has no stray English, that the base spirit is one the guest owns and that a mocktail has no alcohol, then merges them.
- **Bounded cost.** One generation plus at most one repair call per request. Pours are rate limited per IP, images per drink and per IP, all in Postgres so every instance shares the budget.
- **A menu of photographs.** Only a drink that has its photograph can be published.
- **Private by default.** A new drink is reachable only with its edit token, which is returned once, stored hashed, kept in the browser's localStorage, and only ever sent in a POST body.
- **Server-built prompts.** The image prompt comes from the stored recipe, never from the request.

`pnpm test:e2e` starts `pnpm dev` itself, so it needs a reachable `DATABASE_URL`; set `E2E_BASE_URL` to test an already running server instead.

## Deploying

CI publishes the image to `ghcr.io/tendo33/moodshaker` (`linux/amd64`, `linux/arm64`); the server only pulls it:

```bash
cp .env.example .env   # then fill it in
docker compose pull && docker compose up -d
```

That runs the published image plus Postgres. Pin or roll back with `IMAGE_TAG=sha-abc1234 docker compose up -d`. To run the current checkout instead: `docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build`.

| Trigger | Workflow | Result |
|---|---|---|
| Pull request | `ci.yml`, `image.yml` | lint, typecheck, test, build, then the Playwright smoke test against the production build; image built but not pushed |
| Push to `main` | `image.yml` | after the checks pass, pushes `sha-<7 chars>` and `latest` |
| Push a `v*` tag | `image.yml`, `release.yml` | after the checks pass, pushes `<version>` and `<major>.<minor>`, and creates the GitHub release |

On start the container applies migrations (`pnpm db:migrate`), seeds the twelve-drink menu, and starts Next. `/api/health` returns 503 while the database is unreachable. Configuration is described in `.env.example`.

The rate limiter has no in-memory fallback, so a missing database is a deployment error, not a silent downgrade.

Rate limits are per visitor, and the visitor's address comes from a header a client could forge, so say which proxy to believe: `TRUSTED_PROXY_HOPS` for the reverse proxies in front of the app, `TRUST_CLOUDFLARE=true` when the site is behind Cloudflare (the compose file's default; set it to `false` anywhere else, and keep the origin closed to non-Cloudflare traffic). With neither set, every visitor shares one bucket.
