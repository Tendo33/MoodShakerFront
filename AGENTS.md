# Project Agent Entrypoint

This file is the cross-tool entrypoint for AI assistants in MoodShakerFront.

## Read order

1. Start at [.trellis/spec/README.md](.trellis/spec/README.md)
2. Use [.trellis/spec/shared/index.md](.trellis/spec/shared/index.md) for repository-wide facts
3. Use [.trellis/spec/frontend/index.md](.trellis/spec/frontend/index.md) before Next.js, API route, Prisma, or UI work
4. Use [.trellis/spec/shared/verification.md](.trellis/spec/shared/verification.md) before claiming completion

## Working rules

- Treat `.trellis/spec/` as the detailed AI-facing project contract.
- MoodShaker is a bilingual AI cocktail recommendation product, not a generic Next.js template.
- Preserve localized routes, private recommendation access, Prisma/Postgres data contracts, rate limiting, and deployment warnings.
- Update Trellis specs whenever behavior, structure, scripts, public APIs, database schema, or verification commands change.
- Keep changes minimal, typed, and explicit.

## Execution style

### Think before editing

- State assumptions when they affect the implementation.
- If multiple interpretations exist, surface them instead of choosing silently.
- Prefer clarifying uncertainty before editing files.
- If a simpler approach exists, say so before implementing.
- Push back when warranted instead of mechanically following a weak approach.

### Simplicity first

- Choose the smallest change that fully solves the task.
- Do not add speculative flexibility, configuration, or abstraction.
- Prefer direct fixes over framework-like restructuring.
- Do not create abstractions for single-use code.

### Surgical diffs

- Touch only files and lines that relate to the request.
- Match existing project style and terminology.
- Do not improve adjacent code, comments, or formatting unless required.
- If you notice unrelated dead code, mention it instead of deleting it.

### Goal-driven verification

- Turn each task into a verifiable outcome.
- For non-trivial work, keep a short plan and verification path in mind before editing.
- Use [.trellis/spec/shared/verification.md](.trellis/spec/shared/verification.md) before claiming completion.
- Keep looping until the requested outcome is verified, not just implemented.
