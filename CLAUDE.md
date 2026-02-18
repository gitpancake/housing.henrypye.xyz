# Nest Finder — CLAUDE.md

## Project Overview

Apartment hunting app — Next.js 16, React 19, TypeScript, Prisma, PostgreSQL (Supabase), Claude AI.

## Commands

```bash
npm run dev          # Development server
npm run build        # Build (runs prisma generate first)
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without building
npx prisma db push   # Sync schema to database
npx prisma db seed   # Seed default users
```

## Architecture

- **App Router** (`app/`) — Pages and API routes
- **API pattern** — All routes require JWT auth via `getSession()` from `lib/auth.ts`
- **Database** — Prisma ORM with PostgreSQL on Supabase, schema in `prisma/schema.prisma`, uses `housing` schema namespace
- **AI** — Anthropic Claude Haiku 4.5 for listing parsing, evaluation, and area recommendations (`lib/ai/`)
- **Storage** — Supabase Storage for photo uploads (`listing-photos` bucket), client in `lib/supabase.ts`
- **UI** — shadcn/ui components in `components/ui/`, Tailwind CSS 4, Lucide icons, Sonner toasts
- **Maps** — Leaflet + react-leaflet, dynamically imported with SSR disabled
- **Auth** — JWT in HTTP-only cookies, 7-day expiry, bcryptjs password hashing

## Key Files

| File | Purpose |
|------|---------|
| `lib/location-config.ts` | All location-specific settings (city, coords, neighbourhoods, tax brackets). Edit this one file to adapt to a different city. |
| `lib/db.ts` | Prisma client singleton |
| `lib/auth.ts` | JWT session management (`getSession`, `setSession`, etc.) |
| `lib/supabase.ts` | Supabase client for storage |
| `lib/tax.ts` | Take-home pay calculator using brackets from location config |
| `prisma/schema.prisma` | Complete data model |
| `components/calendar/viewing-mode-dialog.tsx` | In-viewing experience: checklist, voice recording with AI notes, unit notes, photos |
| `components/compare/compare-view.tsx` | Side-by-side listing comparison (desktop only) |
| `components/dashboard/viewing-day-banner.tsx` | Viewing day dashboard with schedule, directions, key details |
| `components/listings/expense-calculator.tsx` | Per-listing monthly expense estimator with editable Vancouver-area defaults |
| `app/api/viewings/transcribe/route.ts` | Voice recording → AI-generated viewing notes via Claude |

## Data Model (key models)

- **User** — Auth, preferences, listings, viewings, todos
- **Listing** — Rental listing with photos (JSON string array), scores, viewings
- **ListingScore** — AI evaluation per user per listing (overall score, breakdown, summary)
- **Viewing** — Scheduled viewing linked to listing + user, with status (SCHEDULED/COMPLETED/CANCELLED)
- **ViewingNote** — Per-unit notes during a viewing (title, notes, photos). Multiple per viewing for multi-unit buildings.
- **Todo** — Tasks with scheduling, duration, location
- **AreaRecommendation** — AI-generated neighbourhood suggestions per user

## Viewing Day Features

- **Viewing Checklist** — 14-item checklist in viewing mode (water pressure, light, outlets, noise, cell signal, etc.) with check-off progress tracking
- **Voice Notes** — Record audio during viewings; sent to Claude API which generates concise bullet-point notes; auto-populates the unit notes form
- **Viewing Day Dashboard** — Banner on the main dashboard when viewings are scheduled today/tomorrow; shows schedule, listing details, scores, and Google Maps directions between viewings
- **Side-by-Side Comparison** — `/compare` page (desktop only) to compare up to 4 listings across all attributes, scores, AI summaries, and viewing notes
- **Expense Calculator** — Per-listing monthly cost estimator on listing detail pages; Vancouver-area defaults (hydro, internet, insurance, transit, parking, laundry) with inline editing; shows % of combined take-home pay

## Conventions

- All API routes check `getSession()` and return 401 if unauthorized
- Photos are stored as URL arrays in JSON fields (external URLs or Supabase Storage public URLs)
- Dates use `date-fns` for formatting
- Form handling uses controlled state (not react-hook-form in most components)
- Map components are dynamically imported with `{ ssr: false }` to avoid Leaflet SSR issues
- Mobile-first responsive design with Tailwind breakpoints
- Voice recording uses browser MediaRecorder API (audio/webm) — requires HTTPS or localhost
