# App Router

## Rendering Defaults

- Prefer server components.
- Add `"use client"` only when the component needs browser state, effects,
  event handlers, context providers, media APIs, maps, or similar client-only
  behavior.
- Do not use `generateStaticParams` for database-backed detail pages. The build
  runs with a placeholder `DATABASE_URL` and cannot reach a database, so
  pre-rendering needs a hardcoded copy of the data — which is what
  `lib/cocktail-catalog.ts` was, and how this project shipped two migrations that
  had never been applied. Render on demand instead.
- Do not wrap a page's own component in `next/dynamic` to "reduce the bundle".
  Without `ssr: false` it does not prevent server rendering; it adds a client
  chunk and a `loading` fallback that flashes over content already in the HTML.
  Measured in `docs/performance-baseline.md`: removing four such wrappers changed
  HTML size by under 0.3 K.
- Use route-level metadata helpers for canonical, alternates, Open Graph, and
  JSON-LD when relevant.

## Metadata And SEO

- Every route needs localized metadata. A hardcoded `metadata` object serves one
  language to every locale: before this was fixed, `/cn` returned
  `MoodShaker - Find Your Perfect Cocktail` and `/cn/gallery` had no description
  at all.
- Build page metadata through `lib/i18n/metadata.ts` rather than per route, so
  `hreflang`, `canonical`, and Open Graph stay consistent. Titles and descriptions
  come from the locale dictionaries under `seo.*`.
- Localized routes need `hreflang` alternates including `x-default`. Without them
  a crawler can read the two locales as duplicate pages.
- Private pages (a recommendation reached with an edit token) need
  `robots: { index: false, follow: false }`.
- Content detail pages carry schema.org JSON-LD. See `lib/seo/recipe-schema.ts`.
  Omit a field rather than emitting a wrong one: an invalid `prepTime` makes
  Google reject the whole record.
- `/sitemap.xml` and `/robots.txt` must stay at the origin root. Locale middleware
  that redirects them to `/cn/sitemap.xml` makes both files effectively missing,
  silently — a crawler looks only at the root and does not follow the redirect.
  `proxy.ts` keeps a root-only path list for this; verify with
  `curl -sI localhost:3000/sitemap.xml` returning 200, not 307.
- `app/sitemap.ts` declares `dynamic = "force-dynamic"`. Next prerenders a sitemap
  statically by default, and the build runs with a placeholder `DATABASE_URL`, so
  the cocktail query throws and the sitemap ships with static routes only — zero
  cocktails, silently. Observed directly: one build produced 6 URLs and another 32,
  differing only in whether the database happened to be awake. Same failure mode as
  `generateStaticParams` above. A crawler reads this rarely, so a query per request
  costs nothing worth saving.
  Check the count, not just the status: `curl -s localhost:3000/sitemap.xml | grep -c '<loc>'`.

## Security Headers

- The Content-Security-Policy is built per-request in `proxy.ts` via
  `lib/security/csp.ts`, not as a static header in `next.config.mjs`. A static
  header cannot carry a nonce, which is why the one it replaced fell back to
  `script-src 'unsafe-inline'` — present, passing a header scan, and permitting
  exactly the inline injection a CSP exists to stop.
- `script-src` must never allow `unsafe-inline`. `tests/lib/csp.test.ts` asserts
  this for both dev and production.
- `unsafe-eval` is dev-only, for React refresh.
- `style-src` still allows inline styles: Framer Motion writes element styles and
  Tailwind's runtime injects a style tag. Inline styles cannot execute JavaScript.
- Do not add `rewrites` that match on a client-controlled request header. There
  used to be one mapping `/:lang/:path*` to `/:path*` for any request whose
  `Accept` matched `image/.*`, so any request asking for an image could reach an
  unprefixed route.

## Route Groups And Locales

For bilingual or multi-locale sites:

- Prefer explicit route groups when they produce clearer static output.
- Make locale part of the route contract.
- Keep message dictionaries and content records typed.
- Add a parity check script for required locale keys when the project has
  multiple dictionaries.

## Route Handlers

Only add `app/api/*/route.ts` when the frontend project truly needs a server
boundary.

When adding or changing a route handler:

- Validate input with existing project-local validation helpers.
- Sanitize user-controlled text before rendering or sending it onward.
- Use a finite error-code set.
- Do not expose runtime fingerprints in health responses.
- Apply access checks and rate limiting for public recommendation/image routes.
