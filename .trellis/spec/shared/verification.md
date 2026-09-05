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

## Rendering, Metadata, And Security Headers

For changes to page rendering, metadata, locale routing, or CSP:

```bash
pnpm build && pnpm start
node scripts/measure-ssr.mjs
```

Reports, per route, whether the delivered HTML contains the page's own text with
no JavaScript executed, plus the title and `lang` attribute. Record before and
after numbers in `docs/performance-baseline.md`.

Check separately, because the script does not:

```bash
curl -sI localhost:3000/sitemap.xml | head -1        # 200, not 307
curl -s localhost:3000/robots.txt
curl -sI localhost:3000/cn | grep -i content-security-policy
```

The CSP check must show a `'nonce-…'` in `script-src` and no `'unsafe-inline'`
there.

## Browser Smoke

For UI or route changes, run the app locally and check the affected routes in a
browser. Include screenshots or notes for visual changes when the handoff needs
review.

Playwright is configured (`playwright.config.ts`, `tests/e2e/`) but its browser
binaries could not be downloaded in this environment. When a task calls for LCP,
console errors, or visual regression, either install the browsers first or state
plainly that the check was not run — do not substitute a different measurement and
call it the same thing.

## Rule

Do not claim a Next.js change is complete from code inspection alone. At minimum,
run lint, tests, and build unless the project documents a different gate. Prisma
schema changes also need migration validation through `pnpm db:init`.
