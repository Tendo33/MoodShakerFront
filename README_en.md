<div align="center">

# MoodShaker

**Answer four questions, get a drink for tonight.**

A bilingual AI bartender: a written recipe, a photograph of the drink, and a menu card to take home.

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/developer-platform/r2/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

[![License](https://img.shields.io/badge/License-MIT-2EA043?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A522-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-10.9.0-F69220?style=flat-square&logo=pnpm&logoColor=white)](package.json)

[Quick Start](#quick-start) · [How it works](#how-it-works) · [API](#api) · [Configuration](#configuration) · [Deploying](#deploying)

<sub>[中文](README.md) · English</sub>

<img src="docs/screenshots/home.webp" alt="The MoodShaker home page: six mood swatches on the left, a Dusk Berries cocktail on the right" width="900">

</div>

---

## What this is

Not a cocktail search page, and not a chat box. You answer four questions:

| Question | Options |
| --- | --- |
| Tonight's mood | `unwind` · `celebrate` · `blue` · `romantic` · `spark` · `reflect` |
| How strong | `none` · `light` · `medium` · `strong` |
| What's on your shelf | `gin` · `vodka` · `rum` · `tequila` · `whiskey` · `brandy`, or none at all |
| Classic or creative | `classic` · `creative` |

The model does the rest: it writes a complete recipe (ingredients, measures, steps, glass), the server checks it, and a photograph is generated. Shake another if you don't like it; put it on the public menu if you do.

## Screens

Light paper, large type, and every drink as a ticket. The home page asks for tonight's mood first, and the four questions advance inside one screen:

| The questionnaire | One drink |
| --- | --- |
| <img src="docs/screenshots/questions.webp" alt="The first question: six moods, each paired with a drink photo and a one-line explanation"> | <img src="docs/screenshots/drink.webp" alt="The Gin & Tonic page: photo, name in both languages, tasting note, and an order ticket listing base spirit, strength, glass, time and flavour"> |

The menu filters on two rows, by mood and by base spirit, with one tile per drink:

<img src="docs/screenshots/gallery.webp" alt="The menu: one row filters by mood, the next by base spirit, with a photo card for each drink" width="900">

On a narrow screen the moods become a horizontal strip:

<img src="docs/screenshots/home-mobile.webp" alt="The home page on a phone: title, a horizontally scrolling mood strip and the start button" width="300">

## Quick Start

Requires Node.js 22 or newer, and a PostgreSQL the app can reach. The rate limiter counts in Postgres, so there is no version that runs without a database.

```bash
pnpm install
cp .env.example .env
pnpm db:init
pnpm dev
```

`cp .env.example .env` copies the annotated template; fill in at least `OPENAI_API_KEY` and `DATABASE_URL`, and `IMAGE_API_KEY` if you want photographs. `pnpm db:init` applies the migrations and seeds the classic drinks.

Open `http://localhost:3000`; the locale redirect sends you to `/cn` or `/en`. The home page asks for tonight's mood, and the four questions end on a private drink page at `/en/drink/<id>`.

## Commands

```bash
pnpm test          # unit tests
pnpm test:e2e      # Playwright smoke test; starts pnpm dev itself
pnpm typecheck     # type check
pnpm lint          # ESLint
```

`pnpm test:e2e` needs a reachable `DATABASE_URL`; set `E2E_BASE_URL` to test an already running server.

Two scripts call the real models and cost a little money each run:

| Command | What it does |
| --- | --- |
| `pnpm eval:recipes [n …]` | Pours eight contrasting orders and prints the recipes side by side with timing and any repair turn. Run it after every change to `lib/ai/prompts.ts` or the model |
| `pnpm seeds:build [n …]` | Regenerates the seed menu (recipes and photographs) into `scripts/seed-data.ts` and `public/drinks/` |
| `pnpm seeds:build stages` | Reshoots the two still lifes on the home page |
| `pnpm seeds:build reframe` | Prepares the stored photographs again without calling a model |

Schema changes go through `pnpm db:generate`, which writes a versioned SQL file into `drizzle/`. The container applies those files with `pnpm db:migrate`; nothing pushes a schema straight to the database.

## How it works

One pour, from questionnaire to public menu, with a clear boundary at every step:

```mermaid
flowchart LR
    A[Questionnaire<br/>four closed code fields] --> B[POST /api/drinks<br/>order schema check]
    B --> C[Generate the recipe<br/>lib/ai/generate.ts]
    C --> D[Write it twice<br/>cn + en]
    D --> E[Server checks<br/>lines up, spirit is owned]
    E --> F[(PostgreSQL<br/>private drink + editToken hash)]
    E --> G[Generate the photo<br/>POST /api/drinks/:id/image]
    G --> H[(Cloudflare R2<br/>WebP)]
    F --> I[Private drink page<br/>/drink/:id]
    H --> J{Owner decides}
    J -->|Publish| K[Public menu<br/>/gallery, /cocktail/:slug]
    J -->|Not this one| L[Shake another]

    classDef client fill:#3B82F6,stroke:#2563EB,color:#fff,stroke-width:2px
    classDef service fill:#10B981,stroke:#059669,color:#fff,stroke-width:2px
    classDef data fill:#8B5CF6,stroke:#7C3AED,color:#fff,stroke-width:2px
    classDef choice fill:#F59E0B,stroke:#D97706,color:#fff,stroke-width:2px

    class A,I,K,L client
    class B,C,D,E,G service
    class F,H data
    class J choice
```

Rules the code holds to:

- **One recipe definition.** `lib/domain/recipe.ts` is the stored shape, every text field in both languages. The model writes the recipe twice, once per language (`lib/ai/draft.ts`); the server checks the two line up, that the Chinese has no stray English, that the base spirit is one the guest owns and that a mocktail has no alcohol, then merges them.
- **Bounded cost.** One generation plus at most one repair call per request. Pours are rate limited to 4 per IP every 5 minutes, images per drink and per IP, all counted in Postgres so every instance shares the budget.
- **A menu of photographs.** A drink without a photograph cannot be published; the API returns `IMAGE_REQUIRED` (409). Publishing is limited to 10 an hour per IP, because the cost there is public rows rather than compute.
- **Private by default.** A new drink is reachable only with its edit token, which is returned once, stored hashed, kept in the browser's localStorage, and only ever sent in a POST body.
- **Server-built prompts.** The image prompt comes from the stored recipe, never from the request.

## Project layout

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

## API

All drink endpoints take and return JSON. The edit token is required for reading, generating an image and publishing a private drink.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/drinks` | Pour: validate the order, generate the recipe, return the drink and its one-time `editToken` |
| `POST` | `/api/drinks/[id]` | Read a private drink; body carries `editToken` |
| `POST` | `/api/drinks/[id]/image` | Generate and store the drink photograph |
| `POST` | `/api/drinks/[id]/publish` | Put the drink on the public menu; needs an image |
| `DELETE` | `/api/drinks/[id]/publish` | Take the drink off the menu, keeping its slug for a later re-publish |
| `GET` | `/api/health` | `200` when Postgres answers, `503` while it does not |

Failures come back as `{ error: { code, requestId } }`, with a code such as `IMAGE_REQUIRED`, `RATE_LIMITED` or `INTERNAL`; quote the `requestId` when reporting a problem.

## Configuration

Every key is documented in `.env.example`; the values below are the defaults written there.

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/moodshaker` |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` | Any OpenAI-compatible chat endpoint and its model | `https://api.siliconflow.cn/v1`, `deepseek-ai/DeepSeek-V3.2` |
| `OPENAI_SUPPORTS_JSON_SCHEMA` | Enable `json_schema` only once the endpoint enforces it | `false` |
| `OPENAI_DISABLE_THINKING` | Sends `enable_thinking=false` for hybrid models like Qwen3 | `false` |
| `IMAGE_PROVIDER` | `siliconflow` (Qwen-Image body) or `openai` (OpenAI Images body) | `siliconflow` |
| `IMAGE_API_URL`, `IMAGE_API_KEY`, `IMAGE_MODEL` | Image endpoint | `https://api.siliconflow.cn/v1/images/generations`, `Qwen/Qwen-Image` |
| `IMAGE_FETCH_HOST_ALLOWLIST` | Extra hosts an image URL may come from | empty |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | Cloudflare R2 image storage | `moodshaker-images`, `https://img.moodshaker.de` |
| `SITE_URL` | Canonical URL for metadata, sitemap and JSON-LD | `https://moodshaker.de` |
| `TRUSTED_PROXY_HOPS` | Reverse proxies in front of the app; `0` lets every visitor share one bucket | `0` |
| `TRUST_CLOUDFLARE` | Believe `cf-connecting-ip`; only with the origin closed to everything else | `false` |

`docker compose` overrides two of them: `TRUSTED_PROXY_HOPS=1` and `TRUST_CLOUDFLARE=true`.

### Image provider

`IMAGE_PROVIDER` defaults to `siliconflow`, keeping the Qwen-Image body. Set it to `openai` to call an OpenAI Images-compatible endpoint:

```bash
IMAGE_PROVIDER=openai
IMAGE_API_URL="https://c2a.apimux.cc/v1/images/generations"
IMAGE_API_KEY=""
IMAGE_MODEL="gpt-image-2.6"
```

The body is `model`, `prompt`, `size` (`1024x1024`), `quality` (`high`) and `n` (`1`). Generation often takes 20–60 seconds, so the client waits 120 seconds and retries a 429 or a 5xx twice; timeouts are not retried. A `b64_json` payload is stored in R2 through the same WebP path as a temporary image URL; a returned URL is downloaded only from the host of `IMAGE_API_URL`, the built-in SiliconFlow hosts, or `IMAGE_FETCH_HOST_ALLOWLIST`.

## Deploying

CI publishes the image to `ghcr.io/tendo33/moodshaker` (`linux/amd64`, `linux/arm64`); the server only pulls it:

```bash
cp .env.example .env
docker compose pull && docker compose up -d
```

Copy and fill the template before the first start; `docker compose` reads the same `.env`. Pin or roll back with `IMAGE_TAG=sha-abc1234 docker compose up -d`; to run the current checkout, layer the build override: `docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build`.

| Trigger | Workflow | Result |
| --- | --- | --- |
| Pull request | `ci.yml`, `image.yml` | lint, typecheck, test, build, then the Playwright smoke test against the production build; image built but not pushed |
| Push to `main` | `image.yml` | after the checks pass, pushes `sha-<7 chars>` and `latest` |
| Push a `v*` tag | `image.yml`, `release.yml` | after the checks pass, pushes `<version>` and `<major>.<minor>`, and creates the GitHub release |

On start the container applies migrations (`pnpm db:migrate`), seeds the menu (and keeps it in step with `scripts/seed-data.ts`: changed seeds are rewritten, retired ones removed), and starts Next. `/api/health` returns 503 while the database is unreachable.

The rate limiter has no in-memory fallback, so a missing database is a deployment error, not a silent downgrade.

Rate limits are per visitor, and the visitor's address comes from a header a client could forge, so say which proxy to believe: `TRUSTED_PROXY_HOPS` for the reverse proxies in front of the app, `TRUST_CLOUDFLARE=true` when the site is behind Cloudflare (the compose file's default; set it to `false` anywhere else, and keep the origin closed to non-Cloudflare traffic). With neither set, every visitor shares one bucket.

## Contributing

Working notes for agents and maintainers live in the repository's `AGENTS.md`; visual rules in `DESIGN.md`. Use pnpm only — do not add an npm or yarn lockfile. Keep `/cn` and `/en` routes, the edit-token contract in POST bodies and the Postgres rate limiter intact.

## License

MIT, see `LICENSE`.
