# Cross-Layer Thinking Guide

Use this when a Next.js change spans routes, content data, client interaction,
route handlers, SEO, or deployment.

## Typical Layers

```text
Route file
  -> server component/data helper
  -> client component when needed
  -> route handler when present
  -> external service when present
```

For content sites:

```text
Typed data record
  -> display model helper
  -> page/section component
  -> metadata/schema/sitemap
```

## Questions

- Does the route render statically, dynamically, or with revalidation?
- Does content appear in metadata, JSON-LD, sitemap, search, or filters?
- If data is localized, are IDs/slugs stable across locales?
- Does a client component receive only serializable props?
- If a route handler is public, what prevents abuse?
- Does production build behavior differ from dev behavior?

## Prevention

- Keep route maps and content-maintenance docs updated.
- Add i18n parity checks when dictionaries exist.
- Browser-test the affected route after `pnpm build` when rendering behavior is
  deployment-sensitive.
