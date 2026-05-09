# Claude Code Project Instructions

This file is Claude Code's root entrypoint for MoodShakerFront. Keep detailed
project facts in `.trellis/spec/` and keep this file thin.

## Read order

1. Start at [AGENTS.md](AGENTS.md)
2. Use [.trellis/spec/README.md](.trellis/spec/README.md) for the Trellis spec overview
3. Use [.trellis/spec/shared/index.md](.trellis/spec/shared/index.md) for repository-wide facts
4. Use [.trellis/spec/frontend/index.md](.trellis/spec/frontend/index.md) before Next.js, API route, Prisma, or UI work
5. Run the relevant section in [.trellis/spec/shared/verification.md](.trellis/spec/shared/verification.md)

## Claude-specific notes

- Use [AGENTS.md](AGENTS.md) as the shared project entrypoint.
- Route task-specific work through `.trellis/spec/`.
- Do not reintroduce a parallel AI-docs tree; `.trellis/spec/` is the detailed project contract.
- Keep existing `.agents/skills` custom design/frontend skills intact.
- If this file and `.trellis/spec/` disagree, update this file or follow the spec before changing code.

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
- Update `.trellis/spec/` when behavior, structure, scripts, public APIs, schema, or verification commands change.
- Before declaring success, run the relevant commands in [.trellis/spec/shared/verification.md](.trellis/spec/shared/verification.md).
