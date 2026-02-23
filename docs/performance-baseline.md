# Performance Baseline and Verification Log

This document records comparable baseline and post-optimization measurements.

## Environment

- Date:
- Machine:
- Node:
- pnpm:
- Branch:

## Commands

Run from repository root:

```bash
pnpm build
pnpm exec eslint .
```

## Build Baseline (Before)

- `pnpm build` exit code:
- Total build time:
- Notable warnings/errors:
- First load JS (from build output):

## Build Baseline (After)

- `pnpm build` exit code:
- Total build time:
- Notable warnings/errors:
- First load JS (from build output):

## Manual Scenario Checklist

Use browser devtools performance/memory panel and record values for each stage:

1. Home -> Questions -> Recommendation (including image generation)
2. Recommendation image refresh + regenerate + share card open/close repeatedly
3. Gallery search + filters (base/alcohol/flavor)
4. Gallery -> Detail -> Back
5. Language switch and browser back/forward
6. API timeout/failure path

For each scenario, capture:

- Peak JS heap (MB)
- Noticeable frame drops / stutter notes
- Network/API anomalies

## Storage Footprint

Record localStorage usage before and after key flows.

- `moodshaker-image-data` size (bytes):
- Total `moodshaker-*` keys size (bytes):

## Notes for Performance Monitor Panel

The development `PerformanceMonitor` panel is directional only.

- Green: generally acceptable
- Yellow: monitor
- Red: optimize

Always pair panel observations with real browser performance traces.
