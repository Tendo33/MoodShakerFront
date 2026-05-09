# Recommendation API Security

## Problem

Recommendation or image endpoints leak private access tokens, accept unsafe
inputs, or silently fall back when shared rate-limit storage is unavailable in
production.

## Root Cause

The recommendation flow crosses client state, AI provider calls, Prisma
persistence, and rate limiting. Treating it as a UI-only feature misses server
boundaries.

## Solution

- Keep private recommendation access on `POST /api/recommendation/:id` with
  `editToken` in the JSON body.
- Do not accept `editToken` in URLs and do not echo it in responses.
- Validate request bodies with existing project-local validation helpers.
- Return finite, client-safe error codes.
- Keep provider keys and database credentials server-only.
- Preserve Postgres-backed shared rate-limit buckets and production deployment
  errors for missing shared storage.

## Prevention Checklist

- [ ] Private recommendation recovery cannot be opened without local edit access.
- [ ] Recommendation responses do not include `editToken`.
- [ ] Rate-limit headers remain present on recommendation and image flows.
- [ ] Production does not silently run with missing shared limiter storage.
- [ ] Provider and database secrets stay out of client bundles and logs.
