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

## Real-Browser Checks

`playwright.config.ts` and `pnpm test:e2e` exist but do not run: the browser binaries
will not install in this environment — two attempts reached 448 KB of roughly 150 MB
over nine minutes.

Use `browser-relay` instead. It drives the developer's own Chrome, needs no download,
and is the only check here that sees actual rendering:

```bash
browser-relay navigate "http://localhost:3000/en/questions"
browser-relay tabs                       # grab the tab id; relay loses it on restart
browser-relay eval --tab "$TAB" --stdin  # measure the DOM
browser-relay screenshot --tab "$TAB" /tmp/page.png   # path is positional, not --path
```

Run it for any change to typography, layout, CSS cascade, or client-side navigation.
Three bugs shipped past typecheck, 222 passing tests, lint, a clean build, and
`measure-ssr.mjs` because none of those evaluate CSS or re-render on navigation:
`!important` in `@layer base` overriding component sizes, an invalid locale route from
`Object.entries` on an array, and `<html lang>` going stale after a client navigation.
All three were found in one browser session.

What to measure, rather than eyeballing a screenshot:

- Clipping: `el.scrollWidth > el.clientWidth` on leaf nodes, skipping `ellipsis` and
  scrollable elements. Zero is the expectation on every route in both locales.
- Cascade: `getComputedStyle(el).fontSize` against what the component asked for. A
  mismatch means something in `base` is winning.
- Test the narrow case. The first question renders two wide columns and clips nothing;
  the four-column question is where 136px columns break. Seed `localStorage` with
  `moodshaker-answers` to jump straight there.
- Client navigation, not just a fresh load. Click through the language selector rather
  than visiting `/en` — a hard reload hid the stale-`lang` bug completely.

### Measuring Contrast

Do not parse `getComputedStyle(el).color` as `rgb()`. Tailwind v4's opacity modifiers
(`text-foreground/90`) compile to `color-mix()`, which computes as `lab()` / `oklab()`.
Pulling the first three numbers out of `lab(94.124 5.46 -8.67 / 0.9)` reads L=94 — near
white — as a dark `R=94`. That mistake reported legible text as 1.44:1 and produced a
"66 low-contrast elements" baseline across six pages. The real count was 0.

Composite through a canvas pixel instead, and stack every translucent ancestor
background so glass panels are accounted for:

```js
const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const px = (stack) => {                    // stack = [outermost bg, …, text color]
  ctx.clearRect(0, 0, 1, 1);
  for (const c of stack) { ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); }
  return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
};
```

Reverse-verify any such script against known inputs before trusting a zero: pure white
on `#0b0415` must read ~17:1, near-black ~1.1:1, and include an explicit `lab()` and
`oklab()` case. A script that cannot fail is not evidence.

Two element types need special handling:

- `-webkit-text-fill-color: transparent` (the `.gradient-text` headings) have no solid
  color, so a ratio is meaningless. Check each gradient stop separately.
- `opacity < 0.5` usually means an entrance animation has not settled. Skip those rather
  than reporting them.

### Background Tabs Freeze Animations

`browser-relay` drives a tab that is usually not focused, so `visibilityState` is
`hidden` and Chrome suspends rAF. Framer Motion never advances past `initial`, which for
this project means `blur(10px)` and `opacity: 0` — the page screenshots as badly smeared
even when it is fine for a real user, who sees it settle in ~0.6s. Check
`document.visibilityState` before concluding anything from a screenshot.

`document.getAnimations().forEach(a => a.finish())` only settles WAAPI animations; Framer
Motion drives rAF and ignores it. Neutralizing inline styles does not hold either — the
screenshot's own paint re-runs Framer's frame and overwrites them. What works is a
stylesheet rule with `!important` (higher priority than inline) scoped to a class you add
to just the animated elements:

```js
style.textContent = `.__settled { filter: none !important; opacity: 1 !important;
  transform: none !important; }`;
document.querySelectorAll("[style]").forEach(el => {
  if (/blur|opacity|transform/.test(el.getAttribute("style") || "")) el.classList.add("__settled");
});
```

Do not use `* { opacity: 1 !important }` — it pulls intentionally translucent decoration
(hero orbs at `/10`) to full strength and overstates the noise you are trying to judge.

### Clipping: overflowX Matters

`scrollWidth > clientWidth` alone over-reports. `overflowX: visible` does not clip — the
content just paints past the edge. Only count an element when its own `overflowX` is
`hidden` or `clip`, and skip `sr-only` (the 1×1px accessibility pattern is intentional).
Widening a leaf-node scan to all elements without this check produced 5 phantom hits on
the home page.

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
