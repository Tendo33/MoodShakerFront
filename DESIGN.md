# Design

MoodShaker is a **printed order ticket**. A guest says how the evening feels; the
bartender writes it down on paper — term, dot leader, value — and stamps it when
the drink is poured. The site is that piece of paper on the bar.

This supersedes the "specimen catalogue" contract. Bone ground with a Fraunces
headline and one brick-red button is the default look of every AI consumer
product, so the serif is retired and the ticket is the device.

## Tokens (app/globals.css)

| Token | Value | Use |
| --- | --- | --- |
| `bone` | `#fbf9f4` | receipt paper, page field, ticket body |
| `surface` | `#f1eee6` | quiet fills, hover rows |
| `ink` | `#17161a` | text, selected state, primary fill |
| `note` | `#6b675f` | secondary notes only, never running text |
| `brand` | `#c2402f` | the stamp, and the primary action on hover |
| `desk` | `#ddd7c8` | the surface a ticket sits on; shows through its tear |
| mood fields | `lib/moods.ts` | unchanged, they are product data |

Mood fields stay mid-light: drinks are laid on them with
`mix-blend-mode: multiply` (`.specimen`).

## Type

Two voices, neither of them a serif.

- **Grotesk** (`--font-sans`, `--font-display`): Hanken Grotesk with Noto Sans
  SC. Headlines, body, and anything pressed.
- **Mono** (`--font-mono`, `--font-ticket`): JetBrains Mono. Every line a guest
  would read on the paper — the ticket header, labels, values, the guest note,
  the stamp, the total. Latin only; Chinese stays in the grotesk.

Five sizes: `small`, `body`, `lead`, `head`, `display`. Headlines are weight 700
with tight tracking; the old display serif is gone from `app/layout.tsx`.

## The ticket

Utilities in `app/globals.css`:

- `.ticket` — paper with a hairline shadow; padding `1.5rem 1.25rem 0`.
- `.ticket-tear` — the perforated foot, punched as a mask so the desk shows
  through; negative inline margin so it spans the full ticket width.
- `.leader` — the dotted run between a term and its value (`flex: 1`).
- `.stamp` — brand-red outline, mono, uppercase, rotated `-9deg`; used once, when
  the drink exists.
- `.edge` — the small mono uppercase label used for ticket headers and terms.

A row on the home ticket is `term · · · value`: `.edge` label, `.leader`, value
at `0.95rem`. That example header reads `No. 0001`. The menu and the drink
sheet do not rebuild this paper: they use coss `Card`, `Table`, and `Badge`.
The drink sheet still prints a stable four-digit slip number from the slug.

## Rules

- The home page opens on the promise, not the name: the name is in the header.
  The mood picker is the palette, each mood a block of its own colour.
- Show the product with its own content. "From mood to glass" is one guest's
  real order and the drink it became, written on the ticket, not three captions.
- Navigation is plain text that underlines when pointed at or current; the
  header action is a coss `Button`.
- A drink is always a specimen: its photograph on its mood's field, nothing else
  in the tile. Name and facts sit outside the tile.
- One accent. It appears as the stamp and on hover of the primary action, never
  as a resting fill on every control.
- No eyebrow labels, no gradients, no resting shadows on content, no decorative
  hairline rules. Separate with space and tone; the ticket's rules are the only
  lines we draw.
- Headlines two lines at most. Running text is full ink, 16px or more.
- Every page closes with the block wordmark in `SiteChrome.tsx`.

## Components

- coss ui (`@coss/ui`, Base UI, MIT) in `components/coss/`. Do not hand-write a
  primitive the registry ships.
- `components/action-button.tsx` wraps coss `Button` at its `xl` size — the one
  product decision about the action. Never add a `text-*` utility inside the
  wrapper: tailwind-merge drops the registry's `text-primary-foreground` and the
  label disappears into the fill.
- The questionnaire is built from the registry: mood tiles, answer cards and the
  spirits list are coss `Toggle`; steps and the submit are `Button`; the guest
  note is `Textarea`.
- Buttons, the note field and the multi-select spirits list come from the
  registry. The **single-choice groups** (mood, strength, style) are a native
  `type="radio"` inside a styled `<label>`: coss `Radio` is a fixed-size dot and
  cannot host a colour tile or a drawn glass, and a single-choice question must
  announce itself as a radio, not as a pressed button. This is the one
  deliberate exception, and it is why the e2e suite can still query by role.
- Motion is the `motion` package, not hand-written CSS. Entrances, scroll
  reveals, the question-to-question turn, the shaker and the plinth drift are
  `motion.*` elements driven by the helpers in `lib/motion.ts` (`enter`,
  `reveal`, `revealPicture`, `stepEnter`); `MotionRoot` applies
  `reducedMotion="user"` to all of them. A photograph multiplied onto a mood
  field animates the field and glass together (`Specimen`'s `entrance`) or the
  `<img>` itself (`MotionImage`), never a wrapper around the bare photograph.
  The waits use coss `Progress` (`PourProgress`) and `Skeleton`; errors use
  coss `Alert`. `globals.css` keeps only the `skeleton` keyframe and the
  reduced-motion floor. Every helper tags its element `data-motion`, and a
  `<noscript>` rule in `app/layout.tsx` shows tagged elements when script is
  off, because the hidden start state is written into the server HTML. Do not
  match on inline `opacity:0` instead: the plinth's crossfade layers use it too.

## Motion

- 160–220ms for feedback, 500–620ms for entrances, longer only for the plinth
  crossfade and the photograph.
- The home plinth's slow crossfade is the signature move.
- The wait is alive and honest: the shaker works in bursts, lines of work tick
  off, a clock counts, the bar slows without pretending to finish.
- Everything respects `prefers-reduced-motion`.

## Pictures

- Generated drinks are shot by `buildImagePrompt` as studio specimens on pure
  white, then prepared by `lib/image-levels.ts`.
- Seed drinks live in `public/drinks/`, named by slug and a hash of the picture.
- The provider's "AI 生成" mark is left in place; the footer says the photographs
  are AI-generated.

## Still to do

The questionnaire's progress bar is coss `Progress`; the step counter is still
plain mono text.
