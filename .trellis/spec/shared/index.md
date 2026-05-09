# Shared Index

This spec describes MoodShakerFront, a frontend-led Next.js product with real
route handlers, Prisma/PostgreSQL persistence, AI provider integrations, and
deployment requirements.

## Source of Truth

Read in this order when present:

1. `README.md`
2. `.trellis/spec/README.md`
3. Project docs under `docs/`
4. `AGENTS.md` or another repository entrypoint
5. `package.json` scripts
6. Existing route, component, context, Prisma, and API structure

## Documentation Files

| File | Description | When to Read |
| --- | --- | --- |
| [project-overview.md](./project-overview.md) | MoodShaker product and runtime facts | Always |
| [code-quality.md](./code-quality.md) | Mandatory quality rules | Always |
| [typescript.md](./typescript.md) | TypeScript and schema rules | Type-related decisions |
| [dependencies.md](./dependencies.md) | Stack and dependency constraints | Adding or updating dependencies |
| [verification.md](./verification.md) | Baseline verification commands | Before completion |

## Core Rules

- Default to Server Components.
- Add `"use client"` only for real browser-side behavior.
- No `any`, non-null assertions, or ignored TypeScript errors in new code.
- Public form inputs are validated and sanitized.
- Visible UI work requires browser inspection.
- Database and route-handler changes require Prisma/API contract thinking.
- Do not describe MoodShaker as a generic frontend template.

## Working Rules

- MoodShaker already has Prisma, route handlers, and AI provider integrations;
  preserve their current behavior when refactoring.
- Keep route, content, SEO, and i18n behavior grounded in existing project
  structure.
- Update docs when route maps, environment variables, deployment flow,
  content-maintenance flow, or verification commands change.
- Prefer typed static content and typed site configuration for content-driven
  projects.
- Treat browser smoke testing as required for visible UI or navigation changes.
