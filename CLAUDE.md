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
- Private drink access uses POST body `editToken`; never put it in a URL. It is returned exactly once, by `POST /api/drinks`, and stored only as a SHA-256 hash; no other response may include it.
- Drizzle/PostgreSQL schema changes go through `pnpm db:generate` (versioned SQL in `drizzle/`) and must pass `pnpm db:init` against a local database.
- Missing shared rate-limit storage in production is a deployment error, not a silent fallback.
- Use pnpm only; do not introduce npm/yarn lockfiles.

## Claude execution style

- State assumptions explicitly when they shape the solution.
- Keep diffs tightly scoped to the task.
- Match existing style even when you would normally choose differently.
