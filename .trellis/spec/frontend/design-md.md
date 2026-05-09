# DESIGN.md Workflow

Use this before UI or visual-system work in MoodShaker.

## Source Priority

1. Project root `DESIGN.md` when it exists
2. Existing brand, content-maintenance, or design docs
3. This spec's frontend rules
4. General taste or ad hoc inspiration

`DESIGN.md` is the visual source of truth. It tells the agent how the interface
should look and feel. It does not override accessibility, responsive behavior,
server/client component boundaries, or project-specific content requirements.

## When No DESIGN.md Exists

MoodShaker does not currently have a root `DESIGN.md`. Before major UI work,
choose a starting point from
`https://github.com/VoltAgent/awesome-design-md` or `https://getdesign.md`.

Choose a reference appropriate for a bilingual cocktail recommendation product:
brand, imagery, recipe readability, mobile form ergonomics, and share-card
presentation matter more than generic SaaS density.

Do not invent a brand style in this spec. Add or update root `DESIGN.md` first
when a visual direction is selected.

## Implementation Rules

- Read `DESIGN.md` before editing UI files.
- Use it to guide typography, spacing, color roles, surface treatment,
  component states, and motion.
- Do not blindly copy a brand; adapt the visual language to the target project.
- Keep route metadata, content, SEO, and i18n requirements aligned with the
  visual implementation.
- Do not overwrite an existing `DESIGN.md` without explicit user approval.

## Handoff

For visible UI changes, mention which `DESIGN.md` was used and what browser
viewports/routes were checked.
