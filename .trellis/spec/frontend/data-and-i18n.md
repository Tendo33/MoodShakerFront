# Data And I18n

## Static Content

For content-driven sites, prefer typed static files over ad hoc JSON parsing:

```text
data/
├── products.ts
├── products.zh.ts
├── products.en.ts
└── types.ts
```

Rules:

- Define content types once.
- Keep locale variants structurally aligned.
- Build display models in `lib/` helpers instead of mutating records in
  components.
- Keep slugs, IDs, and route params stable.

## Messages

- Store dictionaries in a predictable location such as `public/messages/`.
- Use a shared loader/helper such as `lib/messages.ts`.
- Add a key-parity check when more than one locale exists.

## SEO And Analytics

- Keep site-wide config in a typed `lib/site-config.ts`.
- Use route-aware helpers for canonical URLs and locale alternates.
- Keep analytics event names finite and documented.
- Do not block rendering on analytics.

## External Inputs

For query params, forms, or URL-carried lead context:

- Validate or normalize before use.
- Keep internal paths internal.
- Escape values before placing them in HTML or email.
- Avoid reflecting arbitrary URLs back to users.
