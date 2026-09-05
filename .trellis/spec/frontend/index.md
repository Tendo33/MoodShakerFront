# Frontend Index

Read this before MoodShaker Next.js, route-handler, Prisma, or UI work.

## Common Shape

```text
app/             # App Router routes, layouts, metadata, route handlers
components/      # Reusable UI and page sections
context/         # Language, cocktail form/result, and error providers
hooks/           # Client hooks
lib/             # Shared helpers, API response, Prisma, rate limits, access
api/             # External AI provider adapters
prisma/          # Schema, migrations, and seed/backfill scripts
public/          # Static assets
scripts/         # Maintenance scripts
docs/            # Maintainer docs when present
```

## Rules

- Read the project root `DESIGN.md` before any UI work.
- If no `DESIGN.md` exists and the task changes visual design, choose a suitable
  design-md starting point before coding.
- Keep route files aligned with Next conventions: `page.tsx`, `layout.tsx`,
  `loading.tsx`, `not-found.tsx`, and `route.ts`.
- Keep server-only logic out of client components.
- Keep browser-only APIs out of server components.
- Use typed helpers for route data, content records, and shared config.
- Put reusable UI in `components/`; put page-specific composition near the page
  or in clearly named page-section components.
- Do not introduce Prisma, a database, or API routes for a pure frontend need.
- MoodShaker already has Prisma and route handlers; preserve their existing
  contracts instead of treating the app as static-only.
- Private recommendation `editToken` belongs in POST body and local browser
  access state, never in URLs.
- Use pnpm for every Node command.

## Before Editing

- Read the target project's README and docs.
- Check `package.json` scripts.
- Inspect existing route groups and component naming before adding new files.

## Documentation Files

| File | Description | When to Read |
| --- | --- | --- |
| [moodshaker-product.md](./moodshaker-product.md) | Product flows and i18n facts | Always |
| [api-and-data.md](./api-and-data.md) | API route, Prisma, privacy, and rate-limit rules | API/data changes |
| [ai-generation.md](./ai-generation.md) | Generation schema, prompts, provider access, output guarantees | Any `lib/ai/` change |
| [directory-structure.md](./directory-structure.md) | File placement and route-group rules | Adding files |
| [design-md.md](./design-md.md) | `DESIGN.md` selection and usage | UI or visual-system changes |
| [app-router.md](./app-router.md) | Server/client component and route handler rules | Route or rendering changes |
| [components-and-styling.md](./components-and-styling.md) | Component, Tailwind, and UX rules | UI changes |
| [data-and-i18n.md](./data-and-i18n.md) | Static content, messages, SEO, analytics | Content or locale changes |
| [quality.md](./quality.md) | Verification and manual smoke checks | Before handoff |
