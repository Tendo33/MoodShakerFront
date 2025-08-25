# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `pnpm dev` - Start development server
- `pnpm build` - Build production version
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint code quality checks

### Package Manager

This project uses `pnpm` as the package manager. All commands should use `pnpm` instead of `npm`.

## Architecture Overview

### Framework Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components (via shadcn/ui)
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Project Structure

#### App Router (`app/`)

- `app/[lang]/` - Internationalized routes with dynamic language support
- `app/layout.tsx` - Root layout with context providers and font configuration
- `app/middleware.ts` - Language detection and URL rewriting middleware

#### Core Directories

- `components/` - Reusable UI components organized by purpose
  - `layout/` - Header, Footer, and layout components
  - `pages/` - Page-specific components (Home, Questions, CocktailDetail, etc.)
  - `ui/` - shadcn/ui base components
  - `animations/` - Framer Motion animation components
- `context/` - React Context providers for state management
  - `CocktailContext.tsx` - Main cocktail recommendation state and logic
  - `LanguageContext.tsx` - Internationalization with English/Chinese support
  - `ErrorContext.tsx` - Global error handling
- `api/` - External API integration modules
  - `cocktail.ts` - AI cocktail recommendation logic with OpenAI integration
  - `image.ts` - Image generation API integration
  - `openai.ts` - OpenAI API client configuration
- `services/` - Business logic services
- `utils/` - Utility functions (localStorage, caching, logging, etc.)
- `lib/` - Shared utilities and configuration

### Key Architectural Patterns

#### Internationalization (i18n)

- **Dynamic routing**: `/en/` and `/cn/` language prefixes
- **Middleware**: Automatic language detection and URL rewriting
- **Context-based**: Language state managed through React Context
- **Cookie persistence**: Language preference stored in cookies
- **Default language**: Chinese (cn) with English fallback

#### State Management

- **Context-first**: Uses React Context for global state
- **LocalStorage persistence**: User progress saved locally
- **Session management**: Unique session IDs for tracking
- **Error boundaries**: Global error handling with context

#### AI Integration

- **Dual agent system**: Classic vs Creative bartender personalities
- **Structured prompts**: Detailed system prompts for consistent AI responses
- **JSON parsing**: Robust parsing of AI responses with fallback handling
- **Image generation**: AI-generated cocktail images with caching

#### Component Architecture

- **Page components**: High-level page logic in `pages/`
- **UI components**: Reusable base components from shadcn/ui
- **Layout components**: Header, footer, and navigation
- **Animation components**: Reusable Framer Motion animations

### Data Flow

#### Cocktail Recommendation Process

1. User answers questions → stored in CocktailContext
2. Form request with preferences → sent to AI service
3. AI generates cocktail recipe → parsed and validated
4. Image generated asynchronously → cached locally
5. Results displayed → saved to localStorage

#### Language Handling

1. Middleware detects language from URL/cookie/Accept-Language header
2. Rewrites URL to include language prefix
3. LanguageContext provides translations throughout app
4. Components use `t()` function for translated strings

### Styling System

#### Tailwind Configuration

- **shadcn/ui integration**: Custom design tokens and CSS variables
- **Custom animations**: fadeIn, fadeOut, float keyframes
- **Dark mode**: Default dark theme with CSS variables
- **Responsive design**: Mobile-first approach with container queries

#### CSS Variables

- Design tokens stored in CSS custom properties
- Consistent spacing, colors, and border radius
- Theme-aware components with HSL color system

### External Dependencies

#### API Integration

- **OpenAI**: For cocktail recipe generation (uses DeepSeek model)
- **Image Generation**: SiliconFlow API for cocktail images
- **Environment variables**: Required for API keys and configuration

#### Build Configuration

- **Next.js config**: CORS headers, image optimization disabled, rewrites for static assets
- **TypeScript**: Strict type checking enabled
- **ESLint**: Custom rules with React hooks and refresh plugins

### Development Notes

#### Working with the Context System

- CocktailContext manages the entire user journey from questions to results
- LanguageContext provides translations and path utilities
- ErrorContext handles global error states and user notifications

#### AI Prompt Engineering

- Prompts are carefully structured in both English and Chinese
- Classic bartender focuses on traditional cocktails
- Creative bartender generates unique recipes
- JSON responses are parsed with comprehensive error handling

#### Image Handling

- Images are generated asynchronously after cocktail recommendations
- Caching system prevents unnecessary API calls
- Fallback handling for image generation failures
- Version control for image refreshing

#### Performance Considerations

- Static assets served from language-agnostic paths
- Client-side navigation with Next.js App Router
- Optimized bundle with dynamic imports where needed
- Image caching and lazy loading patterns
