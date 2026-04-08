# Performance Baseline and Verification Log

This document tracks local verification status, directional build measurements, and the remaining performance-focused risks after the first remediation batch.

## Environment

- Date: 2026-04-08
- Machine: local macOS development environment
- Node: v22.19.0
- pnpm: 10.9.0
- Workspace: current Codex worktree

## Verification Commands

Run from repository root:

```bash
pnpm test
pnpm lint
pnpm build
```

## Current Verification Snapshot

- `pnpm test`: pass
- `pnpm lint`: pass
- `pnpm build`: pass
- Current automated coverage level: lightweight regression suite, not end-to-end coverage

## Build Snapshot

### Earlier local baseline

- `pnpm build` exit code: 0
- Earlier observed total local build time: about `5.01s`
- Notable issue in earlier setup: Prisma client had to be generated manually once after install in this environment

### Current local snapshot

- `pnpm build` exit code: 0
- Recent Next compile phase output: about `2.4s` to `2.9s`
- TypeScript and static page generation complete without build errors
- No current CORS-related header injection in `next.config.mjs`

These numbers are directional only. They are useful for local comparison, not for SLA claims.

## Manual Scenario Checklist

Use browser DevTools performance and memory panels, then record values for each stage:

1. Home -> Questions -> Recommendation, including image generation
2. Recommendation image refresh + regenerate + share card open/close repeatedly
3. Gallery search + filters (base spirit, alcohol level, flavor profile)
4. Gallery -> Detail -> Back
5. Language switch and browser back/forward
6. API timeout, rate-limit, and failure path
7. Same-session recommendation recovery and unavailable-state handling

For each scenario, capture:

- peak JS heap (MB)
- noticeable frame drops or stutter notes
- network or API anomalies
- rate-limit header behavior where applicable

## Storage Footprint

Record localStorage usage before and after key flows:

- `moodshaker-image-data` size (bytes)
- total `moodshaker-*` keys size (bytes)
- whether `moodshaker-recommendation-meta` still includes a valid local `editToken`

## Notes For Performance Monitor Panel

The development `PerformanceMonitor` panel is directional only.

- Green: generally acceptable
- Yellow: monitor
- Red: optimize

Always pair panel observations with real browser traces.

## Current Known Bottlenecks

- Private recommendation recovery still depends on local token presence in the same browser session. The UX is clearer now, but the access model has not been redesigned yet.
- Gallery query strategy still needs deeper indexing and query-shape work in a later batch.
- Global motion and heavy decorative layers still need a reduced-motion pass in a later batch.
- Image optimization still depends on optional `sharp` availability and allowed remote hosts.
- Automated performance measurement is not yet part of CI.
