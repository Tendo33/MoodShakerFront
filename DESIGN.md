# Design

MoodShaker is a specimen catalogue: every drink stands alone, photographed on white, laid on the colour of the mood it was poured for. The page is bone, ink and one red; the colour comes from the moods and the drinks.

## Tokens (app/globals.css)

| Token | Value | Use |
| --- | --- | --- |
| `bone` | `#e6e0d2` | page ground |
| `surface` | `#dcd5c5` | quiet buttons, chips, alternate rows |
| `ink` | `#1a1a1a` | text, selected state |
| `muted` | `#5f5b52` | secondary notes only, never running text |
| `accent` | `#ed4b44` | the primary action, nothing else |
| `night` | `#1a1a1a` | the footer field |
| mood fields | `lib/moods.ts` | unwind `#a9d3b5`, celebrate `#f2c94c`, blue `#aebfd6`, romantic `#f2aca4`, spark `#d4e157`, reflect `#cbbfa8` |

Mood fields are mid-light on purpose: drinks are laid on them with `mix-blend-mode: multiply` (`.specimen`), and a saturated field would muddy the drink.

Type: Hanken Grotesk (Latin) with Noto Sans SC (Chinese), weights 400 and 500 only. Five sizes: `small`, `body`, `lead`, `head`, `display`.

## Rules

- A drink is always a specimen: its photograph on its mood's field, nothing else in the tile. Name and facts sit outside the tile.
- One accent, on the primary action. One button shape, square corners.
- No eyebrow labels, monospace, index numbers (`01`), hairline rules, outlined boxes, gradients or resting shadows. Separate with space and tone.
- Running text is full ink, 16px or more. Grey is for notes.
- Headlines two lines at most. Statements set large stay at three lines or fewer.
- Every page closes with the block wordmark (`BlockMark` in `SiteChrome.tsx`).
- Motion: the slow crossfade on the home plinth is the one signature move; sections enter once as they scroll in (`Reveals.tsx`); everything respects `prefers-reduced-motion`, and nothing is hidden without script.

## Pictures

- Generated drinks are shot by `buildImagePrompt` in `lib/ai/prompts.ts` as studio specimens on pure white, then lifted to clean white by `lib/image-levels.ts` so no grey band shows on the field.
- Seed drinks and the two stage pictures live in `public/drinks/` and `public/stages/`; `pnpm seeds:build` regenerates them.
- The provider stamps a small "AI 生成" mark on every image. It is left in place; the footer also says the photographs are AI-generated.
