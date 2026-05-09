# Verification

Use this before claiming MoodShaker work is complete. Scale the command set to
the files touched.

## Standard

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

## Prisma Changes

```bash
pnpm db:init
```

## Browser Smoke

For UI or route changes, run the app locally and check the affected routes in a
browser. Include screenshots or notes for visual changes when the handoff needs
review.

## Rule

Do not claim a Next.js change is complete from code inspection alone. At minimum,
run lint, tests, and build unless the project documents a different gate. Prisma
schema changes also need migration validation through `pnpm db:init`.
