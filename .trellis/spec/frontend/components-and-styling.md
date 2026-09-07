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
- Client-side state and hooks are testable — jsdom and `@testing-library/react` are
  installed. See `quality.md` for the setup and the working examples.

### Hook Dependency Arrays

- Never put an object, array, or function parameter in a `useCallback` or `useEffect`
  dependency array unless the caller is guaranteed to pass a stable reference. Callers
  pass inline literals (`defaultValue: {}`) and inline arrows, which are new
  references every render, so the callback is rebuilt every render, any effect
  depending on it re-runs, its setState triggers another render, and the loop closes.
- `useAsyncState` shipped with exactly this: `loadData` depended on `defaultValue`,
  `onSuccess`, and `onError`. Measured on the home page's actual call shape — 475
  renders in 1.5 s, against 3 with a stable reference. It did not look like a hang
  because the storage layer's batch delay throttled it, which is why it survived
  review. Hold such values in a ref and depend only on the primitives.
- A render-count assertion is the only thing that catches this class of bug. Typecheck,
  lint, and build all pass, and the page renders correctly — just hundreds of times.

### Storage Reads And Writes

- A read failure degrades to the caller's default; a write failure rejects.
  `localStorage` is shared across the origin, so unparseable content is expected
  noise, not an exception. Rejecting on it put `useAsyncState` in its error state and
  bypassed the caller's fallback, so one bad key broke a whole screen.
- Check against `null`, never truthiness, when deciding whether a stored value
  exists. A persisted `false`, `0`, or `""` is a value; a truthiness check reports it
  as absent.
- `asyncStorage` batches writes with a queue capped at `maxBatchSize`. Anything that
  drains it must re-schedule whatever arrived while it was busy — a batch that returns
  early because another is in flight leaves operations with no scheduler and their
  promises never settle. That surfaces as a save indicator spinning forever, which is
  worse than an error. Covered by burst tests at 20 and 60 writes.

### Concurrent Updates

- Pass an updater function to `updateItem`, never a value merged from state you read
  first. `updateItem("answers", {...answers, [id]: value})` captures `answers` from the
  closure, so two calls in one render read the same snapshot and the second discards the
  first. Measured: three concurrent saves kept one.
- `useBatchAsyncState` reads the previous value from a ref rather than state for this
  reason — a ref is updated synchronously, so the second call in a render sees the
  first's result.
- Do not rely on a caller happening to serialize. `Questions.tsx` guards with
  `selectedOption` and so never hit this, while `toggleBaseSpirit` on multi-select tags
  did: two taps, one selection.

### Background Tasks And Stale Writes

- Any fire-and-forget task that writes state or storage must carry a generation marker
  that reset and re-submit increment, and check it before writing. Image generation runs
  up to 30 s while closing over its round's data; without the marker, tapping "start
  over" mid-flight cleared state and storage, then the finished job wrote the old
  recommendation back into both.
- Check the marker **immediately before each write**, not once at the top of the
  write-back path. Every `await` in between is a yield where the reset can complete —
  check-then-act. The first version of this fix checked once, read correctly, and still
  lost: instrumenting `localStorage` showed DEL, DEL, SET with the stale write last.
  Hence the guard threaded into `persistImageUrl` and `updateRecommendationImage`.
- The same applies to loading flags. A cancelled round must not clear a spinner the
  current round owns, and a reset must clear the flag itself since the cancelled task's
  `finally` no longer will.

## Styling

- Tailwind CSS is the default styling layer.
- Prefer semantic tokens and shared primitives.
- Use Radix or shadcn-style primitives for dialogs, selects, labels, and other
  interaction-heavy controls.
- Keep global CSS limited to tokens, base styles, and app-wide utilities.

### No !important In Global Layers

- Do not add `!important` to a rule in `@layer base`. Tailwind v4 orders `utilities`
  after `base`, so a component that states a size or spacing already wins and global
  rules act as the fallback for elements that state nothing. `!important` inverts that
  and leaves the component no way to opt out.
- Measured cost of getting this wrong: `html:lang(en) h3` with
  `font-size: clamp(1.125rem, 2.5vw, 1.75rem) !important` beat the component's
  `text-lg sm:text-xl` and forced 25.76px into a 136px column that fits about 19.8px.
  `ALCOHOL` overflowed by 40px and the card's `overflow-hidden` clipped the last letter.
  The comment above the block said "scale down"; it was scaling 18px up.
- `!important` elsewhere in `globals.css` is deliberate and should stay — the 16px on
  `textarea` stops iOS zooming on focus, and the `prefers-reduced-motion` block has to
  win. A guard test in `tests/components/LanguageSelector.test.ts` scopes its check to
  `html:lang()` blocks for that reason.
- For English text clipped in a narrow column, reach for
  `overflow-wrap: break-word` before shrinking type or tightening tracking. It only
  applies when a word genuinely does not fit, so titles that already fit are untouched.
  Chinese breaks anywhere and does not need it.
- Trailing letter-spacing is a real effect but a small one: roughly 4px at `0.16em`.
  Measure before treating it as the cause of an overflow — mine was 40px, and zeroing
  the tracking entirely still overflowed by 11px.

## UX Quality

- UI changes must work on mobile and desktop.
- Interactive controls need visible focus states.
- Text must not overflow or overlap at common viewport widths.
- For branded, product, venue, portfolio, or object-focused pages, the subject
  should be visible in the first viewport.
- Use real or project-relevant assets when visual inspection matters.
