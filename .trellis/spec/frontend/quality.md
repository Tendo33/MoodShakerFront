# Quality

## Baseline Commands

Use the project scripts:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

For Prisma schema changes, also run:

```bash
pnpm db:init
```

## Manual Checks

Use browser smoke tests for visible or route-level changes:

- `/cn` and `/en` localized routing
- home to questions to recommendation flow
- private recommendation recovery and unavailable state
- gallery and cocktail detail pages
- image refresh and rate-limit feedback
- share-card rendering and download

## Release Risk

Call out missing automated tests honestly. Passing lint, tests, and build is not
the same as validating the full recommendation flow with real provider keys.
