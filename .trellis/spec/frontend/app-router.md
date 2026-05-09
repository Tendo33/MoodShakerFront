# App Router

## Rendering Defaults

- Prefer server components.
- Add `"use client"` only when the component needs browser state, effects,
  event handlers, context providers, media APIs, maps, or similar client-only
  behavior.
- Use `generateStaticParams` for static content detail pages.
- Use route-level metadata helpers for canonical, alternates, Open Graph, and
  JSON-LD when relevant.

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
