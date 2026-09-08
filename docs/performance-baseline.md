# Performance baseline

`pnpm build && pnpm start` on localhost. Reproduce with:

```bash
pnpm build && pnpm start
node scripts/measure-ssr.mjs
```

## What was measured, and why not LCP

The plan called for LCP numbers. Playwright is configured in this repo but its
browser binaries could not be downloaded in this environment (the chromium
download stalled at 504 KB of ~150 MB with no throughput for 27 minutes), so no
browser-based metric was collected.

`scripts/measure-ssr.mjs` measures the thing the RSC work is actually about:
whether a route's own words arrive in the HTML, with no JavaScript executed. That
is what a crawler sees and what the first paint can show. It does not measure
LCP, and the TTFB column is a warm-cache local number, not a field metric.

## Baseline, 2026-09-06

| Route | Status | TTFB | HTML | Visible text | Script tags | `lang` | Own text in HTML |
|---|---|---|---|---|---|---|---|
| `/cn` | 200 | 31 ms | 50.4 K | 562 ch | 25 | `zh-CN` | yes |
| `/en` | 200 | 8 ms | 51.3 K | 1470 ch | 25 | `en` | yes |
| `/cn/questions` | 200 | 9 ms | 32.7 K | 248 ch | 25 | `zh-CN` | yes |
| `/en/questions` | 200 | 6 ms | 33.1 K | 612 ch | 25 | `en` | yes |
| `/cn/gallery` | 200 | 8 ms | 71.2 K | 1594 ch | 27 | `zh-CN` | yes |
| `/en/gallery` | 200 | 7 ms | 71.4 K | 2303 ch | 27 | `en` | yes |
| `/cn/cocktail/mojito` | 200 | 1516 ms | 65.2 K | 889 ch | 31 | `zh-CN` | yes |
| `/en/cocktail/mojito` | 200 | 723 ms | 67.0 K | 2247 ch | 28 | `en` | yes |

Visible-text counts are characters after stripping tags, scripts, and styles.
Chinese routes show lower counts than their English equivalents because Chinese
carries the same content in fewer characters, not because less was rendered —
both locales deliver the full page.

## What the baseline showed

The task premise was that these routes ship an empty shell and paint their
content only after hydration. That is not what happens: all 8 routes deliver
their own text server-side. `dynamic()` in the page files has no `ssr: false`, so
Next still renders the component on the server; the wrapper costs a separate
client chunk and a `loading` fallback that can flash, but it does not prevent
server rendering.

Three real problems the measurement did confirm:

1. **Metadata is not localized.** `/cn` returns
   `MoodShaker - Find Your Perfect Cocktail` and `/cn/questions` returns
   `Questions | MoodShaker`. Every non-detail route serves English titles and
   descriptions to Chinese users and to crawlers.
2. **`/cn/gallery` and `/en/gallery` share one title,** plain `MoodShaker`, with
   no description at all.
3. **A loading spinner is in the delivered HTML** for all six non-detail routes,
   so the first paint can show a spinner over content that is already present.

Detail-route TTFB (1516 ms cold, 723 ms warm) is a database round trip to a Neon
instance that sleeps when idle. It is not comparable to the other routes and is
not a rendering cost.

## After, 2026-09-06

Same command, warm database and warm connection pool.

| Route | TTFB | HTML | Visible text | Title |
|---|---|---|---|---|
| `/cn` | 25 ms | 50.6 K | 562 ch | `MoodShaker · 找到适合你心情的鸡尾酒` |
| `/en` | 5 ms | 51.5 K | 1470 ch | `MoodShaker · Find the Cocktail That Fits Your Mood` |
| `/cn/questions` | 5 ms | 32.9 K | 248 ch | `调酒问卷 \| MoodShaker` |
| `/en/questions` | 4 ms | 33.3 K | 612 ch | `Cocktail Questionnaire \| MoodShaker` |
| `/cn/gallery` | 264 ms | 76.8 K | 1594 ch | `鸡尾酒图鉴 \| MoodShaker` |
| `/en/gallery` | 217 ms | 77.0 K | 2303 ch | `Cocktail Gallery \| MoodShaker` |
| `/cn/cocktail/mojito` | 189 ms | 68.7 K | 889 ch | `莫吉托 \| MoodShaker` |
| `/en/cocktail/mojito` | 187 ms | 70.1 K | 2247 ch | `Mojito \| MoodShaker` |

What changed, and what did not:

- **Titles and descriptions are localized.** Every route was serving an English
  title regardless of locale; `/cn/gallery` and `/en/gallery` shared a bare
  `MoodShaker` with no description at all.
- **Spinners in the delivered HTML: 6 routes → 2.** The two remaining are the
  gallery's pagination loading state, which is a genuine client-side concern.
- **HTML size is essentially unchanged** (±0.3 K on static routes). Removing the
  `next/dynamic` wrappers did not shrink the payload, because those wrappers were
  not preventing server rendering in the first place — they only moved code into a
  separate chunk. Expect no measurable win here; the reason to remove them was
  that they added a flashing fallback for nothing.
- **Gallery HTML grew** from 71.2 K to 76.8 K, from the added `hreflang`,
  `canonical`, and Open Graph tags.
- **TTFB is not comparable between the two runs.** The baseline had a cold Neon
  instance; this run is warm. Neither is a field measurement.

New SEO output, none of which existed before:

- `/sitemap.xml` — 32 URLs (3 static routes and 13 cocktails, each in 2 locales),
  64 `hreflang` alternates.
- `/robots.txt` — points at the sitemap, disallows `/api/` and the private
  recommendation routes.
- `hreflang` and `canonical` on every localized route, including `x-default`.
- schema.org `Recipe` and `BreadcrumbList` JSON-LD on cocktail pages.
- `noindex, nofollow` on private recommendation pages.

A caveat on both sitemap and robots: locale middleware initially redirected
`/sitemap.xml` to `/cn/sitemap.xml`, which makes both files effectively missing —
a crawler looks for them at the origin root and does not follow the redirect.
`proxy.ts` now keeps a small set of root-only paths unprefixed. Verify with
`curl -sI localhost:3000/sitemap.xml` returning 200, not 307.
