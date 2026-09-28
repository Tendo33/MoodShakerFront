# Project Design System

Use this document as the visual contract for MoodShaker. Keep the values concrete and keep the hard rules near the top.

## Product and direction

- Product: MoodShaker, a bilingual AI cocktail recommendation app (`/cn`, `/en`)
- Audience: people choosing a drink from mood, taste, and skill — not bartenders filling a dashboard
- Primary task: answer a short questionnaire, receive a cocktail, browse the gallery, share a recipe
- Visual direction: retro-futurist vaporwave cocktail terminal
- Tone: late-night, precise, a little theatrical; copy reads like a system log, not a SaaS landing page
- Memorable idea: one drink on a CRT bar screen, recipe as a terminal log — magenta, cyan, and amber against deep violet, never rounded cards

## Colors

- Background: `#0b0415` with a vertical wash `#120322 → #0b0415 → #080212` and faint magenta/cyan corner glows
- Surface: `rgba(19, 10, 37, 0.72)` (`--surface-soft`) and `rgba(19, 10, 37, 0.9)` (`--surface-strong`)
- Surface elevated: `rgba(18, 9, 33, 0.96)` popover / `rgba(14, 7, 26, 0.95)` popup
- Text primary: `#f3ebff`
- Text secondary: `rgba(219, 209, 239, 0.78)`
- Border: `rgba(145, 112, 214, 0.34)`; glass stroke `rgba(255, 255, 255, 0.06)` with a cyan top edge
- Brand accent: primary magenta `#ff4fd8`; secondary cyan `#5df6ff`; tertiary amber `#ffb15b`
- Success / warning / danger: amber for tips; danger `#ff5b76`
- Usage rules:
  - Magenta is identity and selected state. Cyan is the primary action and hover lift. Amber is flavor, time, and caution.
  - Do not introduce extra neon hues. Do not use pure black or pure white fills.
  - Home, gallery, detail, and questionnaire titles are solid Orbitron in the foreground. No gradient and no neon pulse on those headings. The header wordmark is the only place that uses the `gradient-text-bright` class. Do not put `GradientText` back on a page title.

## Typography

- Display font: Orbitron (`--font-heading`), uppercase, tracking `0.08em`–`0.22em`
- Body font: Share Tech Mono (`--font-mono`)
- Mono font: same as body; UI chrome, labels, filters, and logs stay mono
- Heading scale and weights: `h1` clamp `1.875rem–4.5rem` / `700`; English roots at `92%` and slightly smaller heading clamps
- Body size and line height: clamp `0.9375rem–1.125rem`, line-height `1.65`; English body `0.8125rem–1rem`
- Label and metadata style: `text-xs` / `text-sm`, uppercase, tracking `0.16em`–`0.22em`, token color not gray-400

## Spacing, radius, and elevation

- Base spacing unit: 4px
- Home and the questionnaire fill `min-h-[calc(100vh-5rem)]`. They are not a centered `max-w-4xl` column
- Gallery and detail use the viewport width. Copy inside a pane can still sit in `max-w-md`
- Control height: minimum `44px` (`min-h-11`); gallery chips and header actions included
- Radius scale: `0`. No rounded cards, buttons, inputs, or dialogs
- Shadow / border treatment: `0 22px 60px rgba(3, 0, 9, 0.5)` plus a cyan or magenta outer glow on hover; 1px glass stroke; never soft gray Material shadows

## Components

- Buttons: `components/ui/button.tsx`. Primary is cyan outline that fills cyan on hover. Secondary fills magenta. Outline/ghost stay quiet. Loading uses the existing `isLoading` + dictionary string. Keep `href` rendering a Next `Link`.
- Inputs and forms: `components/ui/input.tsx`, `textarea.tsx`, and `filter-chip.tsx`. Black/40 field, primary border, cyan focus. Filter chips use `aria-pressed` and a filled selected state.
- Progress: `components/ui/progress.tsx`. Single magenta fill, zero radius, inset shadow. Used for questionnaire step and generation wait — not a tricolor bar.
- Cards and surfaces: `components/ui/card.tsx`. Variants map to `glass-panel`, `glass-subtle`, `glass-effect`, `glass-popup`. Optional CRT scanline overlay. Hover lift is opt-in.
- Navigation: sticky header, transparent until scroll then `glass-popup`. Mobile menu is `components/ui/sheet.tsx` (right, `w-72`). Language uses `components/ui/dropdown-menu.tsx` (`modal={false}` so it works inside the sheet).
- Overlays: share card uses `components/ui/dialog.tsx`. Both sit at `z-[100]`, zero radius, glass/black surfaces. Do not reintroduce a hand-rolled focus trap for these.
- Recipe: `Tabs` inside `ScrollArea` (`md:h-[70vh]`). Ingredients, including tools, is the first tab. Steps is the second. Lists stay terminal rows with dotted leaders.
- Empty, loading, and error states: a gallery search with no matches uses `Empty`. A missing image uses `Skeleton` inside `AspectRatio`. Generation wait uses Magic UI `Terminal` inside `WaitingAnimation`. Errors use `Alert` destructive plus the existing toast viewport.
- Focus and disabled states: `focus-visible:ring-2 ring-secondary/90 ring-offset-2 ring-offset-background`. Disabled is `opacity-50` + `grayscale`, no pointer events.

## Motion and responsive behavior

- Motion intensity: low. Transform and opacity only; one language per page (ease-out / cubic-bezier `0.16, 1, 0.3, 1`, about 0.45s)
- Main transition language: a short opacity and transform enter. No infinite glow pulse on the hero. Honor `prefers-reduced-motion`
- Reduced-motion behavior: existing global cut in `globals.css`; CRT grid animation off
- Mobile layout changes: home and questionnaire stack to one column. Gallery stays a 2-column gap-px grid, and the first tile spans two columns only from `md`. Detail stacks the image above the tabs. Recipe tabs stay on both widths.
- Breakpoints or container rules: container padding `2rem`, `1rem` below 640px; touch targets stay ≥ 44px

## Do and do not

- Do: reuse `Card`, `Button`, `Badge`, `Input`, `Textarea`, `Progress`, `FilterChip`, `Alert`, `Separator`, `Container`, `Dialog`, `Sheet`, `DropdownMenu`, `Carousel`, `AspectRatio`, `Breadcrumb`, `Tabs`, `ScrollArea`, `HoverCard`, `Empty`, `Skeleton`
- Do: keep bilingual routes, dictionaries, and private `editToken` in POST bodies
- Do: allow English headings to break long Latin words (`overflow-wrap: break-word`)
- Do not: add a second component library or replace vaporwave tokens with a generic shadcn theme
- Do not: round corners, restore animated tricolor gradient text, wrap every block in a card, or bring back hero window chrome, glow blobs, or four spec boxes. Specs are one mono line (`spirit · strength · time · glass`). Gallery tiles are square, gap `1px`, and the first result spans two columns and two rows from `md`
- Do not: mix glow, glass, 3D tilt, particles, and parallax in the same view
- Avoid unless product-specific: extra scanlines, CRT flicker, and neon pulse — they already exist on the shell

## Implementation mapping

- Component foundation: shadcn-shaped source in `components/ui/*` (CVA + `cn` + Radix Slot/Toast). Visual tokens stay MoodShaker.
- Token file / CSS variables: `app/globals.css` `@theme inline` and `:root`
- Icon set: `lucide-react`
- Approved reference components: existing Button variants; Card glass variants; gallery FilterChip; recipe tabs; Magic UI Terminal for generation wait; Great UI TerminalLoader for image load only
- Product primitives that are not generic UI: `TerminalNote`, cocktail share polaroid, `SHAKE.EXE` waiting terminal

## Screens

- Home: `md:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]`. Left is the eyebrow, one solid title, one mood line, one cyan action, then `01` `02` `03`. Right is a `Carousel` of `AspectRatio` 4/5 photos, flush to the pane, with the drink name on the photo. Magenta marks the selected index.
- Questionnaire: the same kind of split, `md:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)]`. Left is the breadcrumb, step count, solid question, and progress. Right is the option tiles. Choosing an option advances the step. The cyan submit exists on the final step.
- Gallery: sticky search and filters. `grid-cols-2 md:grid-cols-4` with `gap-px`. The first tile is `md:col-span-2 md:row-span-2`. `HoverCard` shows spirit and strength. The link stays in the tab order.
- Detail: `Breadcrumb` is Gallery / name. Desktop is `md:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]` with a sticky image. Specs are one mono line above the recipe tabs.
