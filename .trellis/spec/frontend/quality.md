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

## Browser Coverage Gap

`playwright.config.ts` and `pnpm test:e2e` exist, but the browser binaries do not
install in this environment — two attempts reached 448 KB of roughly 150 MB over
nine minutes. There is no jsdom, vitest, or testing-library in the project either,
so nothing here can render a component.

What this rules out: any change to client-side state, persistence, or context wiring
that cannot be proven by typecheck and build. Deleting an unreferenced module is
fine; rewriting how a context persists is not. The remaining half of the state
slimdown is deferred for this reason, not because it lacks value.

What to use instead, for a change that touches rendering:

```bash
node scripts/measure-ssr.mjs   # all 8 routes: status, title, server-rendered text volume
```

Compare before and after. It catches a broken provider tree or a route that stopped
server-rendering its content — the failure modes typecheck misses. It does not
exercise clicks, forms, or localStorage.

For API-level behavior, drive the built server over HTTP from a single Node process
that also seeds its own fixtures and cleans up. Shell loops over `curl` produce
false results here: an empty variable turns into a path that returns 400, and
`grep -c ""` matches every line.

## Release Risk

Call out missing automated tests honestly. Passing lint, tests, and build is not
the same as validating the full recommendation flow with real provider keys.
