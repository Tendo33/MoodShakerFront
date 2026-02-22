# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js App Router; language-specific pages live under `app/[lang]/`, and API routes live under `app/api/`.
- `components/` contains reusable UI, organized by `layout/`, `pages/`, `ui/`, `animations/`, and `share/`.
- `context/` manages global state (language, cocktail flow, errors). `services/`, `api/`, `lib/`, and `utils/` provide business logic and helpers.
- `public/` is for static assets; `docs/screenshots/` stores documentation images.
- `prisma/` contains the schema, migrations, and seed script. `proxy.ts` handles language detection and rewrites.

## Build, Test, and Development Commands
- `pnpm dev`: start the local dev server at `http://localhost:3000`.
- `pnpm build`: create a production build.
- `pnpm start`: run the production build locally.
- `pnpm lint`: run ESLint (Next.js core-web-vitals + TypeScript).
- `pnpm db:init`: generate Prisma client, apply migrations, seed data.
- `pnpm prisma:generate`, `pnpm prisma:migrate`, `pnpm prisma:seed`: run Prisma tasks individually.

## Coding Style & Naming Conventions
- TypeScript + React with 2-space indentation and double quotes; follow ESLint (`pnpm lint`).
- Tailwind CSS is the primary styling approach; global styles live in `app/globals.css`.
- Components use `PascalCase.tsx` (e.g., `CocktailDetailPage.tsx`), hooks use `useX.ts`, contexts use `XContext.tsx`, and route files follow Next.js conventions (`page.tsx`, `layout.tsx`).

## Testing Guidelines
- There is no automated test runner configured yet. Validate changes by running `pnpm dev` and checking key flows (questions, gallery, recommendations).
- If you add tests, document the runner and commands in `README.md` and co-locate tests or use a `tests/` directory.

## Commit & Pull Request Guidelines
- Commit messages generally use a short type prefix: `feat:`, `refactor:`, `chore:`, `docs:`, and occasional `tinyfix`. Keep them concise and descriptive.
- PRs should include: a brief summary, linked issue (if any), verification steps, and screenshots for UI changes. Call out any env or database changes.

## Configuration & Secrets
- Copy `.env.example` to `.env` and set API keys plus `DATABASE_URL`. Never commit secrets.
- For database changes, update `prisma/schema.prisma`, generate a migration, and run `pnpm db:init` to validate locally.
