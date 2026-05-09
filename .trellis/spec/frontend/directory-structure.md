# Directory Structure

Use this when adding files to a Next.js frontend-first repository.

## Common Shape

```text
app/             # App Router routes, layouts, metadata, route handlers
components/      # Reusable UI and page sections
data/            # Typed static content when content-driven
hooks/           # Client hooks
lib/             # Shared helpers, config, SEO, validation, analytics
public/          # Static assets
scripts/         # Maintenance scripts
docs/            # Maintainer docs
```

## Placement Rules

| New thing | Default location |
| --- | --- |
| Route page | `app/**/page.tsx` |
| Route layout | `app/**/layout.tsx` |
| Route loading state | `app/**/loading.tsx` |
| Route not-found state | `app/**/not-found.tsx` |
| Route handler | `app/api/**/route.ts` |
| Shared UI primitive | `components/ui/` |
| Page section | `components/` or a named subfolder |
| Client hook | `hooks/` |
| Static content records | `data/` |
| SEO, config, validation, analytics helper | `lib/` |
| Public images, icons, message dictionaries | `public/` |

## Route Groups

Preserve existing route-group strategy. If the project uses locale-specific root
route groups, keep metadata, loading, not-found, and layout behavior aligned for
each locale.

## Avoid

- Adding backend directories to a frontend-only project.
- Adding API routes just to move local UI logic to the server.
- Creating generic folders before there is a second real use case.
