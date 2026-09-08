# Image Provider Failures

## Problem

Recommendation image generation or refresh fails because provider credentials,
object storage configuration, remote fetch allowlists, or CORS are misconfigured.

## Root Cause

The image flow spans four dependencies that can each fail independently: the LLM
image provider, the server-side download of its temporary URL, transcoding, and
the R2 upload. Earlier versions swallowed failures in the middle of that chain
and stored the provider's temporary URL instead, which produced rows whose images
died within hours.

## Failure Semantics

`POST /api/image` never persists anything on a partial failure. No image is
better than a dead link.

| Failure point | Status | `error.code` | Writes DB |
| --- | --- | --- | --- |
| Cross-site `Origin` | 403 | `FORBIDDEN_ORIGIN` | no |
| Body carries `prompt` | 400 | `INVALID_PAYLOAD` | no |
| `editToken` mismatch | 403 | `FORBIDDEN` | no |
| Rate limited | 429 | `RATE_LIMITED` | no |
| Provider generation failed | 502 | `IMAGE_PROVIDER_FAILED` | no |
| Download failed / timeout / over 10MB | 502 | `IMAGE_FETCH_FAILED` | no |
| Transcoding failed | 500 | `IMAGE_PROCESSING_FAILED` | no |
| R2 upload failed | 502 | `IMAGE_UPLOAD_FAILED` | no |
| R2 not configured | 503 | `OBJECT_STORE_UNAVAILABLE` | no |

Every error carries a `requestId` that also appears in the server log line.

## Solution

- Check `IMAGE_API_URL`, `IMAGE_API_KEY`, and optional `IMAGE_MODEL`. A 402 from
  the provider means the account balance is exhausted, not a code fault.
- Check the five `R2_*` variables. `instrumentation.ts` logs which are missing at
  startup, so look there before debugging a request.
- The provider serves images from a **different host than its API**. Delivery
  hosts are built into `lib/storage/image-hosts.ts`; add to
  `IMAGE_FETCH_HOST_ALLOWLIST` when switching providers rather than widening the
  check to a suffix match.
- Keep the bucket's CORS origins in `infra/r2-cors.json` in sync with every site
  origin, including preview environments. A missing origin does not break the
  page — it silently makes share cards export a frame with no cocktail in it.
- The prompt is derived server-side in `lib/ai/image-prompt.ts`, which is
  `server-only`. A request carrying `prompt` is rejected, never ignored.

## Prevention Checklist

- [ ] Image refresh requires a matching `editToken`.
- [ ] Rate-limit and provider errors surface to the user with their code.
- [ ] No failure path writes a URL the server has not verified it can serve.
- [ ] Share-card export still contains the image after a refresh.
- [ ] New site origins are added to `infra/r2-cors.json` and re-applied.
- [ ] Object keys stay content-addressed so `immutable` caching stays truthful.

## Local Development Gotcha

Proxy tools in fake-ip mode (Clash, Surge) resolve the bucket domain into
`198.18.0.0/15`, and Next's image optimizer then rejects it as a private address
with the misleading message `"url" parameter is not allowed`. The config is fine;
add the domain to the proxy's direct rules. Verify real resolution with DoH:

```bash
curl -s -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=img.moodshaker.de&type=A'
```
