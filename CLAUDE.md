# Claude Code Project Instructions

This file is Claude Code's root entrypoint for MoodShakerFront.

## Read order

1. Start at [AGENTS.md](AGENTS.md)

## Claude-specific notes

- Use [AGENTS.md](AGENTS.md) as the shared project entrypoint.
- Keep existing `.agents/skills` custom design/frontend skills intact.

## Project guardrails

- MoodShaker is a bilingual AI cocktail recommendation product, not a generic Next.js template.
- Preserve `/cn` and `/en` localized routes, `proxy.ts` language detection, and localized dictionaries.
- Private recommendation access uses POST body `editToken`; never put it back in the URL or echo it in responses.
- Prisma/PostgreSQL schema changes require migration and `pnpm db:init` validation.
- Missing shared rate-limit storage in production is a deployment error, not a silent fallback.
- Use pnpm only; do not introduce npm/yarn lockfiles.

## Claude execution style

- State assumptions explicitly when they shape the solution.
- Keep diffs tightly scoped to the task.
- Match existing style even when you would normally choose differently.
