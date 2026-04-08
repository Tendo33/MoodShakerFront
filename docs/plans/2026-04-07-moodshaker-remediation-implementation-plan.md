# MoodShaker Remediation Implementation Plan

## Status Snapshot

- Last updated: 2026-04-08
- Current phase state:
  - Phase 0: completed
  - Phase 1: partially completed
  - Phase 2+: not started
- Current repo posture:
  - suitable for staging and controlled beta
  - not yet ready for full production launch

## Completed In This Batch

- Restored local verification with `pnpm test`, `pnpm lint`, and `pnpm build`
- Added `postinstall` Prisma generation support
- Removed URL-based `editToken` transport for private recommendation access
- Standardized recommendation access onto `POST /api/recommendation/:id`
- Removed `editToken` echo from private recommendation responses
- Removed unsafe wildcard CORS header configuration
- Added shared Postgres-backed rate-limit buckets with explicit production fail-closed behavior when the table is missing
- Added rate-limit headers for recommendation and image APIs
- Standardized safe client-facing 500 responses
- Improved recommendation recovery UX when local private access is unavailable
- Added lightweight regression tests for request parsing, rate-limit behavior, and recommendation recovery gating

**Goal:** Harden MoodShaker's security boundary, stabilize the recommendation flow, and reduce technical debt enough that ongoing feature work is safe and fast.

**Architecture:** We will fix platform-level risks first so later refactors do not build on unsafe assumptions. Then we will stabilize the product flow around recommendation session recovery and image generation, followed by data/query improvements and frontend decomposition. Each phase should leave the app in a shippable state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma, PostgreSQL, SWR

---

## Delivery Rules

- Work phase-by-phase. Do not start frontend decomposition before P0 security and session access work is merged.
- Keep changes vertically sliced where possible: API contract, client caller, validation, and tests in the same branch.
- Prefer small PRs with clear rollback boundaries.
- Before claiming success on any phase, run the verification commands for that phase.
- If `node_modules` is still missing, first install dependencies and get `pnpm lint` running before deeper refactors.

## Phase 0: Baseline And Tooling

**Outcome:** We can run verification locally and measure regressions before touching risky code.

**Status:** Completed

### Task 1: Restore local verification

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/package.json`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/package.json)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/README.md`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/README.md)

**Steps:**
1. Install dependencies with `pnpm install`.
2. Run `pnpm lint` and record the current failure set.
3. Add any missing scripts needed for plan verification.
4. Update README verification section if the current commands are incomplete or stale.

**Verification:**
- `pnpm lint`
- `pnpm build`

**Exit criteria:**
- Lint and build are runnable in a clean local setup.

### Task 2: Add planning and tracking notes

**Files:**
- Create or modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/docs/performance-baseline.md`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/docs/performance-baseline.md)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/README.md`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/README.md)

**Steps:**
1. Record current known bottlenecks from the audit.
2. Capture baseline checks for recommendation flow, gallery search, and detail page load.
3. Add a short “how to verify changes” section for future contributors.

**Verification:**
- Manual review of the baseline doc.

**Exit criteria:**
- The repo contains an explicit pre-change baseline and verification checklist.

## Phase 1: Security Boundary Hardening

**Outcome:** Private recommendation access, CORS, and rate limiting are no longer demo-grade.

**Status:** In progress

### Task 3: Replace query-token recommendation access flow

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/recommendation/[id]/route.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/recommendation/%5Bid%5D/route.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/recommendation-sessions.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/recommendation-sessions.ts)

**Steps:**
1. Design the new access contract: `POST` body or HttpOnly cookie.
2. Update server route to reject query-string token access.
3. Update client fetch flow to use the new contract.
4. Keep the route backward-compatible only if absolutely needed during migration.
5. Remove token exposure from any navigable URLs.

**Verification:**
- Private recommendation is retrievable when the client has valid access.
- Private recommendation is not retrievable with only the raw ID.

**Exit criteria:**
- `editToken` is no longer transported in the URL.

### Task 4: Harden recommendation session secrets

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/recommendation-sessions.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/recommendation-sessions.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/prisma/schema.prisma`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/prisma/schema.prisma)

**Steps:**
1. Decide whether `editToken` remains plaintext or moves to hashed storage.
2. If hashing, add migration fields and comparison logic.
3. Define expiration and rotation behavior for edit access.
4. Prevent session rows from becoming permanent bearer secrets.

**Verification:**
- Old and new session access behave as expected in local testing.

**Exit criteria:**
- Session edit access has defined lifecycle and safer storage semantics.

**Status note:** Not started. `editToken` transport has been tightened, but token lifecycle, expiry, and storage-hardening are still pending.

### Task 5: Fix CORS policy

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/next.config.mjs`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/next.config.mjs)

**Steps:**
1. Remove wildcard origin plus credentials.
2. Narrow CORS to explicit origins if cross-origin access is genuinely required.
3. Avoid setting CORS headers on internal-only endpoints by default.

**Verification:**
- API still works from the app origin.
- Headers no longer advertise an unsafe wildcard policy.

**Exit criteria:**
- No API response returns `Access-Control-Allow-Origin: *` together with credentials.

**Status note:** Completed. The wildcard CORS header block has been removed from `next.config.mjs`.

### Task 6: Replace in-memory rate limiting

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/rate-limit.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/rate-limit.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/cocktail/route.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/cocktail/route.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/image/route.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/image/route.ts)

**Steps:**
1. Introduce a shared rate-limit backend or clearly isolate an interface for one.
2. Remove client-controlled `sessionId` from the main throttle key.
3. Add `Retry-After` handling for rejected requests.
4. Give image refresh its own stricter limit bucket.

**Verification:**
- Repeated requests hit a consistent limit.
- Limits still apply after process restart if shared storage is used.

**Exit criteria:**
- Rate limiting is no longer trivially bypassed by rotating `sessionId`.

**Status note:** Mostly completed. Shared Postgres-backed buckets and `Retry-After` headers are in place. Ongoing cleanup/observability work is still pending.

### Task 7: Standardize server error responses

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/cocktail/[id]/route.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/cocktail/%5Bid%5D/route.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/cocktail/route.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/cocktail/route.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/image/route.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/image/route.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/api-response.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/api-response.ts)

**Steps:**
1. Stop returning raw thrown messages on 500s.
2. Use stable error codes and user-safe messages.
3. Keep full detail only in server logs.

**Verification:**
- Forced internal errors return generic client-safe responses.

**Exit criteria:**
- No internal error message is directly reflected to the browser on 500.

**Status note:** Completed for the touched recommendation, cocktail detail, cocktail generation, and image routes.

## Phase 2: Core Product Flow Stabilization

**Outcome:** Recommendation creation, recovery, regeneration, and image refresh behave consistently.

**Status:** Not started

### Task 8: Redesign recommendation recovery

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Home.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Home.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx)

**Steps:**
1. Define the exact states: local-only, recoverable private recommendation, published cocktail, expired recommendation.
2. Update home screen CTA logic to distinguish those states.
3. Improve recommendation page loading and fallback behavior when recovery fails.

**Verification:**
- Existing local session works.
- Cleared local storage path degrades gracefully.
- Invalid recommendation no longer feels like a broken app state.

**Exit criteria:**
- Recovery behavior is predictable and user-facing states are explicit.

### Task 9: Add structured request state handling

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx)

**Steps:**
1. Replace scattered booleans with a clearer request lifecycle model.
2. Separate recommendation loading from image loading.
3. Make regeneration and refresh paths reuse the same state primitives.

**Verification:**
- Loading, success, partial success, and failure all render intentionally.

**Exit criteria:**
- Request state no longer depends on loosely coordinated booleans.

### Task 10: Tighten request validation

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/request-validation.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/request-validation.ts)

**Steps:**
1. Add string length caps.
2. Add answer count and enum validation.
3. Add base spirit array size bounds.
4. Add prompt length limits for image generation.

**Verification:**
- Oversized and malformed payloads fail with 400.

**Exit criteria:**
- Validation is cost-aware and domain-aware, not just type-aware.

## Phase 3: Data Model And Query Performance

**Outcome:** Gallery and cocktail retrieval scale better and are easier to reason about.

**Status:** Not started

### Task 11: Split cocktail data access module

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/cocktail-data.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/cocktail-data.ts)
- Create: `lib/cocktail-repository.ts`
- Create: `lib/cocktail-mappers.ts`
- Create: `lib/gallery-search.ts`
- Create: `lib/cocktail-fallbacks.ts`

**Steps:**
1. Move Prisma access into a repository file.
2. Move normalization and mapping logic into a mapper file.
3. Move gallery filter composition into a search file.
4. Keep the public API stable while splitting internals.

**Verification:**
- Existing pages still compile and render.

**Exit criteria:**
- `cocktail-data.ts` is no longer the main dumping ground for all data-layer concerns.

### Task 12: Rework gallery query strategy

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/gallery-search.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/gallery-search.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/prisma/schema.prisma`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/prisma/schema.prisma)

**Steps:**
1. Separate full-text-like search from exact/structured filters.
2. Add the minimum viable indexes needed for the chosen query shape.
3. Avoid mixing broad `contains` search with every filter branch if a simpler branch exists.

**Verification:**
- Gallery search returns expected results.
- Query plan or local timings improve on sample data.

**Exit criteria:**
- Gallery queries are structured enough to scale beyond small datasets.

### Task 13: Move image payload storage out of Postgres

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/prisma/schema.prisma`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/prisma/schema.prisma)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/image/route.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/api/image/route.ts)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/recommendation-sessions.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/lib/recommendation-sessions.ts)

**Steps:**
1. Choose storage strategy: object storage URL, key, or CDN-backed asset path.
2. Add migration path away from storing raw image payloads in `TEXT`.
3. Update image read/write code paths.

**Verification:**
- New images save and render correctly.
- DB rows no longer carry large inline image payloads.

**Exit criteria:**
- The data model stores media references instead of full binary payload strings.

## Phase 4: Frontend UX And Rendering Improvements

**Outcome:** The app is easier to use, easier to read, and cheaper to render.

### Task 14: Fix gallery search interaction model

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/[lang]/gallery/GalleryContent.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/%5Blang%5D/gallery/GalleryContent.tsx)

**Steps:**
1. Replace route-refresh-per-keystroke with submit-based or deferred search.
2. Add explicit apply/reset controls if needed.
3. Preserve filter state across navigation cleanly.

**Verification:**
- Typing in search no longer causes immediate route churn on every pause.

**Exit criteria:**
- Gallery search feels responsive and intentional.

### Task 15: Add reduced-motion handling

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/layout.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/layout.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Home.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Home.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailDetailPage.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailDetailPage.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx)

**Steps:**
1. Detect `prefers-reduced-motion`.
2. Disable or soften continuous motion and large transitions.
3. Keep state feedback while reducing visual intensity.

**Verification:**
- Motion-heavy pages remain usable with reduced motion enabled.

**Exit criteria:**
- The app respects motion accessibility preferences.

### Task 16: Normalize error, empty, and not-found states

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/error.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/error.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/global-error.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/global-error.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/not-found.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/not-found.tsx)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/[lang]/cocktail/not-found.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/%5Blang%5D/cocktail/not-found.tsx)
- Modify: locale files under [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/locales`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/locales)

**Steps:**
1. Localize all hard-coded English fallback surfaces.
2. Align copy and hierarchy across error-like states.
3. Remove inconsistent “system failure” terminology where it hurts clarity.

**Verification:**
- English and Chinese both render complete error and not-found states.

**Exit criteria:**
- Error-state UX is localized and coherent.

## Phase 5: Frontend Decomposition And Maintainability

**Outcome:** The highest-risk frontend modules are small enough to change safely.

### Task 17: Decompose `Questions.tsx`

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Questions.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Questions.tsx)
- Create: `components/pages/questions/QuestionStep.tsx`
- Create: `components/pages/questions/BaseSpiritStep.tsx`
- Create: `components/pages/questions/QuestionProgress.tsx`
- Create: `hooks/useQuestionnaireFlow.ts`

**Steps:**
1. Extract static question definitions.
2. Extract per-step rendering components.
3. Move orchestration logic into a dedicated hook.
4. Keep UI behavior stable while shrinking the page component.

**Verification:**
- Questionnaire still supports start, continue, submit, retry, and reset.

**Exit criteria:**
- `Questions.tsx` becomes an assembly layer instead of a full feature monolith.

### Task 18: Decompose `Home.tsx`

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Home.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/Home.tsx)
- Create: `components/pages/home/HomeHero.tsx`
- Create: `components/pages/home/HomeResumeCard.tsx`
- Create: `components/pages/home/FeaturedCocktailCarousel.tsx`
- Create: `components/pages/home/HomeCTA.tsx`

**Steps:**
1. Extract hero copy and CTAs.
2. Extract resume/recommendation card logic.
3. Extract featured cocktail carousel.
4. Keep the page focused on composition and state wiring.

**Verification:**
- Homepage content and CTAs still match current behavior.

**Exit criteria:**
- `Home.tsx` is substantially smaller and easier to review.

### Task 19: Decompose `CocktailRecommendation.tsx`

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/pages/CocktailRecommendation.tsx)
- Create: `components/pages/recommendation/RecommendationHeader.tsx`
- Create: `components/pages/recommendation/RecommendationImagePanel.tsx`
- Create: `components/pages/recommendation/RecommendationFallbackState.tsx`

**Steps:**
1. Extract top action area.
2. Extract image panel and refresh overlay.
3. Extract no-data / fallback state.
4. Keep recommendation page focused on data selection and composition.

**Verification:**
- Recommendation page supports recovery, image refresh, regenerate, and share.

**Exit criteria:**
- Recommendation page is easier to reason about and no longer mixes all concerns inline.

### Task 20: Split result context responsibilities

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/context/CocktailResultContext.tsx)
- Create: `hooks/useRecommendationRequest.ts`
- Create: `hooks/useRecommendationPersistence.ts`
- Create: `hooks/useRecommendationImage.ts`

**Steps:**
1. Isolate request orchestration.
2. Isolate persistence.
3. Isolate image refresh/generation.
4. Recompose them in the context provider.

**Verification:**
- Recommendation flow behavior remains unchanged while code boundaries improve.

**Exit criteria:**
- Context no longer acts as a feature god object.

## Phase 6: UX Copy, Theming, And Design System Cleanup

**Outcome:** The interface is more readable, more intentional, and less dependent on repeated hard-coded neon styles.

### Task 21: Centralize visual tokens

**Files:**
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/globals.css`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/app/globals.css)
- Modify: [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/utils/style-constants.ts`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/utils/style-constants.ts)
- Modify core shared UI under [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/ui`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/components/ui)

**Steps:**
1. Define a smaller, more reusable token set.
2. Replace scattered glow/border/shadow recipes with token-based variants.
3. Reduce duplicated “special effect” classes in page components.

**Verification:**
- Shared UI still renders consistently after token consolidation.

**Exit criteria:**
- Style intent lives in shared tokens instead of per-page copy-paste class strings.

### Task 22: Rewrite product-critical copy

**Files:**
- Modify locale files in [`/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/locales`](/Users/simonsun/.codex/worktrees/9525/MoodShakerFront/locales)
- Modify key pages that embed hard-coded strings

**Steps:**
1. Prioritize homepage CTA, recommendation fallback, and error states.
2. Remove jargon that feels decorative but reduces clarity.
3. Keep brand personality without making core actions harder to understand.

**Verification:**
- Both languages read clearly in main flows.

**Exit criteria:**
- Product copy improves comprehension and conversion, not just atmosphere.

## Phase 7: Tests, Observability, And Release Readiness

**Outcome:** The app has enough protection to keep moving after the refactor.

### Task 23: Add API and data-layer tests

**Files:**
- Create: `tests/` or co-located tests for API validation, session access, image route, and gallery search

**Steps:**
1. Add tests for request validation limits.
2. Add tests for private recommendation access control.
3. Add tests for image route allowlist and failure handling.
4. Add tests for gallery filtering logic.

**Verification:**
- Test suite runs locally and in CI.

**Exit criteria:**
- Critical backend behaviors are covered by automated tests.

### Task 24: Add flow-level UI verification

**Files:**
- Create: `tests/e2e/` or equivalent

**Steps:**
1. Cover home -> questions -> recommendation happy path.
2. Cover recommendation recovery and fallback path.
3. Cover gallery search and filter interaction.

**Verification:**
- End-to-end smoke path passes consistently.

**Exit criteria:**
- Main product flow has regression protection.

### Task 25: Add observability hooks

**Files:**
- Modify API routes and logging utilities
- Modify frontend tracking integration if present

**Steps:**
1. Record recommendation generation success/failure.
2. Record image generation success/failure and latency.
3. Record gallery search usage and zero-result rates.
4. Add request IDs where missing.

**Verification:**
- Logs and metrics show enough context to debug production issues.

**Exit criteria:**
- We can tell what broke and where when the app misbehaves.

## Recommended Execution Order

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7

## First Working Sprint Recommendation

If we are starting implementation now, the first sprint should only include:

1. Phase 0 Task 1
2. Phase 1 Task 3
3. Phase 1 Task 5
4. Phase 1 Task 6
5. Phase 1 Task 7
6. Phase 2 Task 8

That gives us the highest-risk fixes first without opening too many refactor fronts at once.

## Definition Of Done For “Ready To Build Features Again”

- Lint and build run cleanly.
- Private recommendation access no longer depends on URL token leakage.
- CORS and rate limiting are production-safe.
- Recommendation recovery UX is intentional.
- Gallery search no longer triggers route churn on every input pause.
- Critical API paths have automated tests.
