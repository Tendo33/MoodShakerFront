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
- Running text is full ink, 16px or more. Grey is for notes, and only on bone: on a mood field `muted` falls below 4.5:1, so notes there are `text-ink/70`.
- Headlines two lines at most. Statements set large stay at three lines or fewer.
- Every page closes with the block wordmark (`BlockMark` in `SiteChrome.tsx`).
- Motion says where the guest is, and is never decoration.
  - The home plinth's slow crossfade is the signature move (a fading layer carries `mix-blend-multiply` itself, or its photograph crosses the field as a white square; the same holds for anything that moves or fades a photograph).
  - A page arrives with one short fade (`app/[lang]/template.tsx`), then its parts enter once (`.enter`, and `Reveals.tsx` as sections scroll in).
  - The questionnaire is one screen per question. A step leaves and the next arrives in the direction of travel (`.step`); the progress bar and the controls sit at the foot of the screen and do not move.
  - The wait is alive and honest: the shaker works in bursts, the lines of work are ticked off, a clock counts, and the bar slows without ever pretending to finish. It closes only when the drink is there, and the page holds on "poured" for a beat.
  - The drink's page opens on the mood's colour it was ordered in, the recipe settles into the outline, and the photograph comes up when it has loaded (`DevelopedImage`).
  - Durations: 160-220ms for feedback, 500-620ms for entrances, longer only for the crossfade and the photograph. Everything respects `prefers-reduced-motion`, and nothing is hidden without script.

## Pictures

- Generated drinks are shot by `buildImagePrompt` in `lib/ai/prompts.ts` as studio specimens on pure white, then prepared by `lib/image-levels.ts`: near-white is lifted to white so no grey band shows on the field, and the rim is faded so a shadow running off the picture does not end in a straight line.
- `public/og.png` is the card for shared links without a drink of their own; `node scripts/build-og.mjs` redraws it.
- Seed drinks live in `public/drinks/`, named by slug and a hash of the picture so a re-poured drink is never served from a cache; `pnpm seeds:build` re-pours them and removes the photographs it replaced. The two stage pictures on the home page live in `public/stages/`; `pnpm seeds:build stages` reshoots them in the same light.
- The provider stamps a small "AI 生成" mark on every image. It is left in place; the footer also says the photographs are AI-generated.
