# TypeScript

## Mandatory Rules

- Keep strict TypeScript.
- Do not introduce `any` in new code.
- Use `unknown` for untrusted external data, then narrow with schemas or type
  guards.
- Do not use non-null assertions when an explicit guard is possible.
- Do not duplicate a data shape in multiple places.

## Static Content Types

For content-driven sites:

- Define shared content record types once under `data/` or `lib/`.
- Keep locale variants structurally aligned.
- Build derived display models in helpers instead of mutating records in
  components.
- Keep route params and IDs stable.

## Route Handler Types

When a route handler exists:

- Validate input at the boundary.
- Export or colocate response types when the frontend consumes the shape.
- Keep error codes finite and documented.
- Treat query params as strings until parsed.

## React Types

- Component props should be explicit.
- Use `React.ReactNode` for flexible children.
- Keep client component props serializable when they cross a server-to-client
  boundary.
