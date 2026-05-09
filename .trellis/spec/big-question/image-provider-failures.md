# Image Provider Failures

## Problem

Recommendation image generation or refresh fails because provider credentials,
remote image fetch allowlists, or stored image payloads are misconfigured.

## Root Cause

The image flow depends on server-side provider settings, recommendation edit
access, optional remote fetch optimization, and client-side recovery state.

## Solution

- Check `IMAGE_API_URL`, `IMAGE_API_KEY`, and optional `IMAGE_MODEL`.
- Keep `IMAGE_FETCH_HOST_ALLOWLIST` aligned with any remote host the server must
  fetch.
- Preserve edit-access checks on `POST /api/image`.
- Show explicit failure or rate-limit feedback rather than hiding errors behind
  stale local state.
- Keep image refresh and share-card state aligned with `CocktailResultContext`.

## Prevention Checklist

- [ ] Image refresh requires valid local edit access.
- [ ] Rate-limit errors are visible to the user.
- [ ] Remote image fetch hosts are allowlisted intentionally.
- [ ] Share-card rendering still works after image refresh.
