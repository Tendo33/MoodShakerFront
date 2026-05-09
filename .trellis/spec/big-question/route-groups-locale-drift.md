# Route Groups And Locale Drift

## Problem

Chinese and English routes render different layouts, metadata, loading states,
or not-found behavior.

## Root Cause

Locale-specific route groups drift apart. One route group gets a new layout,
metadata helper, or page behavior while the other stays unchanged.

## Solution

- Keep shared shell behavior in reusable components.
- Keep locale-specific root layouts explicit.
- Update both route groups when changing shared metadata, loading, or not-found
  behavior.
- Keep route maps and docs current.

## Prevention Checklist

- [ ] Route map lists every locale route.
- [ ] Metadata helper handles both locales.
- [ ] Message dictionaries pass parity checks when present.
- [ ] Browser smoke covers at least one route per affected locale.
