# MoodShaker Frontend

<div align="center">

An AI-powered bilingual cocktail experience that turns a quick mood check into a complete drink recommendation.

[![Chinese](https://img.shields.io/badge/README-%E4%B8%AD%E6%96%87-0f172a?style=for-the-badge)](./README.zh.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

[![Overview](https://img.shields.io/badge/Overview-What%20it%20does-22c55e?style=flat-square)](#overview)
[![Screenshots](https://img.shields.io/badge/Screenshots-Preview-f59e0b?style=flat-square)](#screenshots)
[![Quick Start](https://img.shields.io/badge/Quick%20Start-Run%20locally-3b82f6?style=flat-square)](#quick-start)
[![Architecture](https://img.shields.io/badge/Architecture-How%20it%20works-8b5cf6?style=flat-square)](#architecture)
[![Deployment](https://img.shields.io/badge/Deployment-Docker-ef4444?style=flat-square)](#deployment)

</div>

## Table of Contents

- [MoodShaker Frontend](#moodshaker-frontend)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Why MoodShaker](#why-moodshaker)
  - [Highlights](#highlights)
  - [Screenshots](#screenshots)
    - [Current Screens](#current-screens)
  - [Demo Flow](#demo-flow)
  - [Tech Stack](#tech-stack)
  - [Architecture](#architecture)
    - [Main Runtime Pieces](#main-runtime-pieces)
  - [Project Structure](#project-structure)
  - [Quick Start](#quick-start)
    - [1. Prerequisites](#1-prerequisites)
    - [2. Install dependencies](#2-install-dependencies)
    - [3. Configure environment variables](#3-configure-environment-variables)
    - [4. Prepare the database](#4-prepare-the-database)
    - [5. Start the development server](#5-start-the-development-server)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [API Endpoints](#api-endpoints)
  - [Localization](#localization)
  - [Deployment](#deployment)
  - [Troubleshooting](#troubleshooting)
    - [Prisma `P2022`: missing `thumbnail` column](#prisma-p2022-missing-thumbnail-column)
    - [Recommendation or image API errors](#recommendation-or-image-api-errors)
  - [Validation](#validation)
  - [Contributing](#contributing)
  - [Notes](#notes)

## Overview

MoodShaker is a bilingual web app for cocktail discovery and recommendation. Instead of searching from a static list, users answer a short mood-based questionnaire and receive a personalized cocktail with ingredients, tools, steps, and a shareable visual card.

The project is built with Next.js App Router, React 19, TypeScript, Prisma, and a pair of AI endpoints for recommendation and image generation. It also ships with a localized experience for Chinese and English users, a gallery for browsing drinks, and a detail page for exploring each recipe.

## Why MoodShaker

Most cocktail tools are either recipe databases or chat demos. MoodShaker sits somewhere in between: it keeps the interaction lightweight, but still feels like a guided experience.

The result is a product flow that is easy to understand:

- start from mood instead of ingredients
- generate a drink recommendation with personality
- enrich the result with image generation
- keep everything browsable through gallery and detail pages

## Highlights

- Two recommendation styles are supported through different bartender personas: `classic_bartender` and `creative_bartender`.
- Language-aware routing is built in, with `/cn` and `/en` paths plus automatic redirect logic in [`proxy.ts`](./proxy.ts).
- The full product journey is already connected: landing page, questionnaire, recommendation page, gallery, cocktail details, and share card output.
- The image flow supports external generation APIs and thumbnail backfill for stored assets.
- The frontend is organized around reusable components, split contexts, and performance-focused client data handling.

## Screenshots

### Current Screens

| Home | Questionnaire |
| --- | --- |
| ![Home](docs/screenshots/home_full.png) | ![Questionnaire](docs/screenshots/questions_start.png) |

| Gallery | Cocktail Detail |
| --- | --- |
| ![Gallery](docs/screenshots/gallery.png) | ![Cocktail Detail](docs/screenshots/cocktail_detail.png) |


## Demo Flow

```text
Landing page
  -> mood questionnaire
  -> AI cocktail recommendation
  -> generated image + recipe details
  -> shareable card
  -> gallery browsing
  -> cocktail detail revisit
```

## Tech Stack

- Framework: Next.js 16 with App Router
- UI: React 19, Tailwind CSS 4, Framer Motion, Radix UI, Lucide
- Language: TypeScript
- Data layer: Prisma with PostgreSQL
- Data fetching: SWR
- AI integration: OpenAI-compatible chat endpoint and image generation endpoint
- Tooling: pnpm, ESLint, tsx, Docker Compose

## Architecture

```mermaid
flowchart LR
  A["User"] --> B["Localized App Routes (/cn, /en)"]
  B --> C["Questionnaire / Gallery / Detail Pages"]
  C --> D["App API Routes"]
  D --> E["Chat Recommendation Provider"]
  D --> F["Image Generation Provider"]
  D --> G["Prisma Client"]
  G --> H["PostgreSQL"]
  C --> I["Share Card / Client State / UI Animations"]
```

### Main Runtime Pieces

- App routes live under [`app/[lang]`](./app/%5Blang%5D) and provide the user-facing pages.
- API handlers live under [`app/api`](./app/api) and coordinate recommendation, detail lookup, and image generation.
- Shared UI lives in [`components`](./components), while app-wide state is managed in [`context`](./context).
- Database schema, migrations, seed data, and maintenance scripts are in [`prisma`](./prisma).

## Project Structure

```text
app/
  api/
    cocktail/
    image/
  [lang]/
    page.tsx
    questions/page.tsx
    gallery/page.tsx
    cocktail/[id]/page.tsx
    cocktail/recommendation/page.tsx
components/
  animations/
  layout/
  pages/
  share/
  ui/
context/
docs/
  screenshots/
lib/
locales/
prisma/
public/
proxy.ts
```

## Quick Start

### 1. Prerequisites

- Node.js `>= 22`
- pnpm `>= 10`
- PostgreSQL `15+` or Docker

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then fill in the required values in `.env`.

### 4. Prepare the database

Make sure PostgreSQL is running and `DATABASE_URL` is reachable:

```bash
pnpm db:init
```

This command will:

- generate the Prisma client
- apply migrations
- seed initial cocktail data

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).  
Requests to `/` will be redirected to the proper language path, defaulting to `/cn`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | API key for the chat recommendation endpoint |
| `OPENAI_BASE_URL` | Yes | OpenAI-compatible base URL, such as `https://api.siliconflow.cn/v1/` |
| `OPENAI_MODEL` | Yes | Chat model name |
| `IMAGE_API_URL` | Yes for image generation | Image generation endpoint |
| `IMAGE_API_KEY` | Yes for image generation | Image generation API key |
| `IMAGE_MODEL` | No | Image model name |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `HOST_PORT` | Optional | Exposed web port for Docker Compose |
| `POSTGRES_USER` | Optional | Database username for Docker Compose |
| `POSTGRES_PASSWORD` | Optional | Database password for Docker Compose |
| `POSTGRES_DB` | Optional | Database name for Docker Compose |

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local development server |
| `pnpm build` | Build the production bundle |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint |
| `pnpm db:init` | Generate Prisma client, apply migrations, and seed data |
| `pnpm prisma:generate` | Generate Prisma client only |
| `pnpm prisma:migrate` | Apply Prisma migrations |
| `pnpm prisma:seed` | Seed cocktail data |
| `pnpm prisma:backfill-thumbnails` | Backfill the `thumbnail` field from stored images |

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/cocktail` | Generate a cocktail recommendation from questionnaire input |
| `GET` | `/api/cocktail/:id` | Fetch a cocktail detail record by id |
| `POST` | `/api/image` | Generate a cocktail image and optionally persist optimized assets |

## Localization

- Supported languages are `cn` and `en`.
- [`proxy.ts`](./proxy.ts) detects language from the URL, cookie, and `Accept-Language` header.
- Requests without a language prefix are redirected to a localized route.
- Translation dictionaries live in [`locales/cn.ts`](./locales/cn.ts) and [`locales/en.ts`](./locales/en.ts).

## Deployment

This repository already includes the essentials for containerized deployment:

- [`Dockerfile`](./Dockerfile) for multi-stage image builds
- [`docker-compose.yml`](./docker-compose.yml) for the web app and PostgreSQL
- [`scripts/docker-entrypoint.sh`](./scripts/docker-entrypoint.sh) for startup-time schema initialization and seed handling

Run locally with Docker:

```bash
docker compose up -d
```

## Troubleshooting

### Prisma `P2022`: missing `thumbnail` column

If you see:

```text
The column `cocktails.thumbnail` does not exist in the current database
```

Run:

```bash
pnpm db:init
```

If the database already exists and only migrations are missing, you can also try:

```bash
pnpm prisma:migrate
```

### Recommendation or image API errors

- Check that the keys and URLs in `.env` are correct.
- Make sure `OPENAI_BASE_URL` points to an OpenAI-compatible endpoint.
- Inspect the server logs for the handlers under [`app/api`](./app/api).

## Validation

There is no dedicated automated test runner configured yet, so the safest baseline checks are:

```bash
pnpm lint
pnpm build
```

Recommended manual smoke checks:

1. Complete the questionnaire and verify recommendation generation.
2. Browse the gallery and confirm search or filters still behave correctly.
3. Open a cocktail detail page and switch languages.
4. Verify share card generation and download flow if you touch that area.

## Contributing

If you open a PR, it helps to include:

- a short summary of the change
- linked issue or context, if any
- verification steps
- screenshots for UI changes
- notes for environment or database updates

## Notes

- AI-generated content should be reviewed before real-world use.
- Do not commit `.env` or any production secret values.
