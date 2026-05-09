# Common Issues And Solutions

Documented pitfalls for the MoodShaker Next.js product.

## Severity Levels

| Level | Description |
| --- | --- |
| Critical | Build fails, route crashes, private access leaks, or production safety degrades |
| Warning | Route, locale, SEO, or conversion flow is broken |
| Info | Degraded UX with a known fallback |

## Issue Index

| Issue | Category | Severity |
| --- | --- | --- |
| [Route Groups and Locale Drift](./route-groups-locale-drift.md) | Routing / I18n | Warning |
| [Recommendation API Security](./recommendation-api-security.md) | API Routes / Privacy / Rate Limits | Critical |
| [Image Provider Failures](./image-provider-failures.md) | AI Images / Provider Config | Warning |

## Quick Debugging Checklist

### Locale Page Shows Wrong Metadata

1. Check the route group layout for that locale.
2. Check canonical and alternates generation.
3. Check message/content parity across locales.

### Recommendation Or Image API Looks Unsafe

1. Check request-body validation and finite error codes.
2. Confirm `editToken` is never accepted in URLs or echoed in responses.
3. Confirm rate-limit storage and headers still behave as documented.

### Image Generation Or Refresh Fails

1. Check image provider env vars.
2. Check `IMAGE_FETCH_HOST_ALLOWLIST` for remote fetches.
3. Confirm same-browser edit access is still present.
