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

## Component And Hook Tests

Hooks and client-side state are testable here. `jsdom` and `@testing-library/react`
are devDependencies. Copy from whichever example matches the shape of what you are
testing, since each needs a different amount of setup:

- Plain storage, no React — `tests/utils/asyncStorage.test.ts`.
- A hook — `tests/hooks/useAsyncState.test.ts`.
- A hook touching the DOM — `tests/hooks/useFocusTrap.test.ts`. Adds jsdom's element
  constructors on `globalThis` (the hook uses `instanceof HTMLElement`, and Node's own
  constructors do not match nodes from the jsdom document) plus a `setTimeout`-backed
  `requestAnimationFrame`.
- A context — `tests/context/CocktailFormContext.test.ts`, or
  `tests/context/CocktailResultContext.test.ts` when `fetch` is involved. Both need
  `next/navigation` mocked, because `LanguageProvider` calls `usePathname` and there is
  no app router here. That is why `--experimental-test-module-mocks` is in the `test`
  script; without it the full suite fails on those files while each passes alone.
- Provider nesting has to match the real app: `LanguageProvider` outside
  `CocktailFormProvider` outside `CocktailResultProvider`. The result context reads
  questionnaire answers, so a missing form provider throws.
- Reset between tests through `asyncStorage.removeItem`, not `localStorage.clear()`.
  `asyncStorage` is a module singleton whose read-through cache outlives a test, so one
  test's answers otherwise surface in the next.

A correction worth keeping, because it cost real time: an earlier note in this file
claimed there was "no jsdom to fall back on" and deferred state-layer work on that
basis. That described what happened to be installed, not what was possible — nobody
had tried. `pnpm add -D jsdom` takes about 2 seconds. Playwright's browser binary is
a genuinely different problem; a pure-JS DOM is not. Check before concluding a tool
is unavailable.

Setup that these tests depend on, in this order, all before React is imported:

- Assign `window`, `document`, and `localStorage` from the JSDOM instance onto
  `globalThis`, and set `IS_REACT_ACT_ENVIRONMENT = true`.
- `navigator` is a getter-only property on current Node, so it needs
  `Object.defineProperty`, not assignment.
- Do **not** pass `pretendToBeVisual: true`. It starts a perpetual
  requestAnimationFrame loop that holds Node's event loop open, so the suite finishes
  and then hangs. Nothing here needs rAF.
- Close the window in an `after()` hook.
- Imports go inside a helper function. tsx compiles these tests to CJS, where
  top-level await is unavailable.
- Generate storage keys **outside** the render callback. `useAsyncState({storageKey:
  uniqueKey()})` inside it produces a new key every render, which correctly rebuilds
  the hook's callbacks and re-runs its effect — a loop of the test's own making that
  looks exactly like a product bug.

## Playwright

`playwright.config.ts` and `pnpm test:e2e` exist but do not run: the browser binaries
will not install in this environment — two attempts reached 448 KB of roughly 150 MB
over nine minutes. Full-flow checks across pages remain manual for now.

## Route-Level Changes

For a change that touches rendering:

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
