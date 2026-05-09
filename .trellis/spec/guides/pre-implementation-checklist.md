# Pre-Implementation Checklist

Use this before non-trivial Next.js frontend work.

## Routes

- [ ] Which route group owns this page?
- [ ] Does the change affect metadata, canonical URLs, alternates, sitemap, or
  robots?
- [ ] Does every locale need the same route behavior?

## Components

- [ ] Can this stay a Server Component?
- [ ] If it needs `"use client"`, can the interactive part be isolated?
- [ ] Does a similar component, section, hook, or helper already exist?
- [ ] Are images using the project's existing image strategy?

## Data And I18n

- [ ] Is content typed?
- [ ] Do locale variants remain structurally aligned?
- [ ] Does a message-key parity check need updating?
- [ ] Are query params parsed and normalized before use?

## Forms And Route Handlers

- [ ] Is input validated?
- [ ] Is user-controlled text sanitized before email or HTML rendering?
- [ ] Are origins, rate limits, honeypot fields, or finite error codes needed?
- [ ] Are secrets kept server-only?

## Verification

- [ ] Which package scripts prove the change?
- [ ] Which routes need browser smoke testing?
