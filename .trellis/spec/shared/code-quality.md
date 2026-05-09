# Code Quality

These rules apply to frontend-first Next.js repositories.

## Mandatory Rules

- Prefer Server Components by default.
- Add `"use client"` only for event handlers, React state/effects, browser APIs,
  client context, or third-party client-only widgets.
- Do not use `any`, non-null assertions, `@ts-ignore`, or unnecessary
  `@ts-expect-error` in new code.
- Do not use `<div>` as a button.
- Do not expose secrets through `NEXT_PUBLIC_*`.
- Do not add Prisma, auth, or database dependencies unless the project already
  has them or the user explicitly asked for that backend capability.

## Error Handling

- Public route handlers should return a finite error-code set.
- Public form inputs must be validated and sanitized.
- Avoid reflecting arbitrary URLs back to users.
- Do not expose runtime fingerprints through public health endpoints.

## UI Quality

- Visible UI changes require mobile and desktop inspection.
- Interactive controls need accessible labels and visible focus states.
- Text must not overflow or overlap.
- Use project-relevant assets when the user needs to inspect a real product,
  place, object, state, or person.

## Before Handoff

Run the local gate: lint, type check, build, and any project-specific checks
such as i18n parity or tests.
