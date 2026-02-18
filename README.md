# Nest Finder

A full-stack apartment hunting app built with Next.js, Prisma, and PostgreSQL (Supabase). AI-powered listing evaluation, area recommendations, collaborative viewing scheduling, and budget planning.

## Features

- **Listing Management** — Add listings by URL or paste text; AI extracts structured data automatically
- **AI Evaluation** — Claude scores each listing against your personal preferences (budget, bedrooms, transit, pets, etc.)
- **Area Recommendations** — AI-powered neighbourhood suggestions based on your priorities
- **Calendar & Viewings** — Schedule viewings, plan viewing days across multiple listings in an area
- **Viewing Mode** — On-site note-taking and photo capture per unit, with Supabase Storage uploads
- **Multi-User** — Multiple users with independent preferences, scores, and color-coded calendar entries
- **Interactive Map** — Leaflet map view of all listings with geocoded addresses
- **Budget Calculator** — Take-home pay estimation with configurable tax brackets

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: PostgreSQL via Supabase, Prisma ORM
- **AI**: Anthropic Claude API (Haiku 4.5)
- **Storage**: Supabase Storage (listing & viewing photos)
- **UI**: shadcn/ui (Radix), Tailwind CSS 4, Lucide icons
- **Maps**: Leaflet + react-leaflet
- **Auth**: JWT with HTTP-only cookies, bcryptjs

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Push schema to database
npx prisma db push

# Seed default users
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PRISMA_URL` | Supabase pooled connection string |
| `POSTGRES_URL_NON_POOLING` | Supabase direct connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `AUTH_PASSWORD` | Admin user password |
| `JWT_SECRET` | Secret for signing JWTs |

## Project Structure

```
app/
  api/                  # REST API routes
    listings/           # Listing CRUD, evaluation, photo upload
    viewings/           # Viewing CRUD, notes, note photos
    auth/               # Login, logout, session
    recommendations/    # AI area recommendations
    preferences/        # User preferences
    todos/              # Task management
  calendar/             # Calendar page
  listings/             # Listing pages (list, detail, edit, new)
  map/                  # Map view
  budget/               # Budget calculator
  profile/              # User profile

components/
  calendar/             # Calendar view, viewing dialogs, viewing mode
  listings/             # Listing cards, forms, plan viewing day
  map/                  # Map components (listings map, location picker)
  budget/               # Budget calculator view
  dashboard/            # Dashboard content
  preferences/          # Onboarding wizard
  layout/               # App shell, page wrapper
  ui/                   # shadcn/ui components

lib/
  ai/                   # AI integration (evaluate, parse, recommend, scrape)
  location-config.ts    # City/region configuration (see below)
  auth.ts               # JWT session management
  db.ts                 # Prisma client
  geocode.ts            # Address geocoding
  supabase.ts           # Supabase client
  tax.ts                # Tax calculation
```

## Location Configuration

All location-specific settings are centralized in `lib/location-config.ts`. To adapt the app to a different city/region, edit this single file:

- **`cityName` / `regionName`** — Used in AI prompts
- **`defaultCenter`** — Map default coordinates
- **`neighbourhoods`** — Neighbourhood list for AI area recommendations
- **`taxLabel` + tax brackets** — Provincial/state tax calculation
- **`exampleAddress` / `exampleNeighbourhood`** — UI placeholder text
- **`exampleParsedListing`** — Example data for AI listing parser

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production (runs prisma generate)
npm run start     # Start production server
npm run lint      # ESLint
```
