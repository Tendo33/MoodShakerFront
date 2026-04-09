# Release Readiness

This document reflects the current release posture of the repository as of 2026-04-08.

## Verdict

- Local development: ready
- Staging / preview / controlled beta: ready
- Full production launch: not ready yet

## What Is Already In Place

- `pnpm test`, `pnpm lint`, and `pnpm build` all pass in the current workspace.
- Batch 1 security hardening is implemented:
  - private recommendation access uses `POST` body instead of URL query token
  - private recommendation responses no longer echo `editToken`
  - unsafe wildcard CORS headers were removed
  - API 500 responses use stable error codes and safe messages
  - Postgres-backed shared rate limiting exists with rate-limit headers
- Recommendation recovery failure is now explicit instead of silently broken.

## Current Production Blockers

### 1. Deployment must apply the new Prisma migration

Shared rate limiting depends on the `rate_limit_buckets` table. In production, missing shared limiter storage is treated as a deployment error rather than silently degrading forever.

Required artifact:

- [prisma/migrations/20260408093000_add_rate_limit_buckets/migration.sql](../prisma/migrations/20260408093000_add_rate_limit_buckets/migration.sql)

### 2. End-to-end regression coverage is still missing

Current automated coverage is useful but narrow. There is no end-to-end smoke test for:

- home -> questions -> recommendation
- image refresh
- same-session recommendation recovery
- unavailable-state handling

### 3. Observability is still below launch threshold

The repository does not yet define or ship minimal production metrics for:

- recommendation success rate
- image success rate
- rate-limit hit rate
- recommendation recovery failure rate
- gallery search latency

### 4. Batch 2 stabilization is not done

The next hardening layer is still pending:

- stronger request validation bounds
- clearer recommendation and image loading state model
- more consistent recovery and failure states

## Minimum Checklist Before Full Production Release

1. Apply the latest Prisma migrations in the target environment.
2. Verify the `rate_limit_buckets` table exists.
3. Verify the recommendation endpoint degrades to `503 Service Unavailable` if shared limiter storage or the primary database is unavailable.
4. Run:

```bash
pnpm test
pnpm lint
pnpm build
```

5. Execute a manual smoke pass with real environment variables.
6. Add at least one end-to-end smoke test for the primary recommendation flow.
7. Add minimum runtime metrics and alerting.
8. Re-evaluate release readiness after Batch 2 stabilization.

## Notes

- This project is close to being promotion-ready for a controlled beta.
- It should not be described as fully production-hardened yet.
