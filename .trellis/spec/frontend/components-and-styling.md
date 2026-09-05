# Components And Styling

## Design Source

- Read the project root `DESIGN.md` before UI work.
- If no `DESIGN.md` exists, use [DESIGN.md Workflow](./design-md.md) before
  major visual changes.
- `DESIGN.md` guides visual language, but accessibility and responsive behavior
  remain mandatory.

## Naming

- Components use `PascalCase.tsx`.
- Hooks use `useX.ts`.
- Context providers use `XContext.tsx`.
- Route files follow Next.js names.

## Component Boundaries

- Server components compose data and markup.
- Client components own interaction state.
- Avoid passing large untyped blobs through page trees.
- Split large page sections when the split gives a reader a real boundary, not
  just because a file is long.

## State Layer

- The root layout nests `CocktailFormProvider` then `CocktailResultProvider`, in
  that order. A `CocktailProvider` facade used to wrap the pair; it was removed
  because its own combined hook had no consumers, so the indirection only hid the
  nesting order that matters.
- `utils/asyncStorage.ts` is the client persistence used by both cocktail contexts.
  Only `asyncStorage` and `removeStorageKeysAsync` are exported — add an export only
  when something imports it.
- A component that returns `null` outside development still ships its client chunk
  to every production visitor. `PerformanceMonitor` did exactly that for 302 lines.
  Gate this kind of tooling at the import, not inside the render.
- Before deleting a module, check for internal `this.method()` calls as well as
  external imports. Checking only external call sites reports live methods as dead.
- Deleting an unreferenced module is provable by static analysis plus typecheck and
  build. Rewriting live client persistence is not — that needs browser-level
  coverage first, which this repo does not currently have (see `quality.md`).

## Styling

- Tailwind CSS is the default styling layer.
- Prefer semantic tokens and shared primitives.
- Use Radix or shadcn-style primitives for dialogs, selects, labels, and other
  interaction-heavy controls.
- Keep global CSS limited to tokens, base styles, and app-wide utilities.

## UX Quality

- UI changes must work on mobile and desktop.
- Interactive controls need visible focus states.
- Text must not overflow or overlap at common viewport widths.
- For branded, product, venue, portfolio, or object-focused pages, the subject
  should be visible in the first viewport.
- Use real or project-relevant assets when visual inspection matters.
