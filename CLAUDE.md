# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an unofficial calendar import tool for Sanrio Virtual Festival (Vfes) 2025. Users can select events from the timetable and download ICS files to add them to their calendars. The app is deployed on Cloudflare Workers.

## Development Commands

```bash
# Development server (Vite with Cloudflare proxy)
nr dev

# Production preview (builds then runs with Wrangler)
nr preview

# Build for production
nr build

# Type checking
nr typecheck

# Linting (Biome)
nr lint
nr lint:fix

# Run all tests
nr test

# Run unit tests only (Vitest)
nr test:vitest

# Run E2E tests (Playwright)
nr test:e2e           # Both Vite and Workers
nr test:e2e:vite      # Vite dev server only
nr test:e2e:workers   # Production build only

# Generate event IDs
nr generate:event-ids
```

## Architecture

### Tech Stack
- **Frontend**: React Router v7 with SSR, React 18, TailwindCSS v4
- **Backend**: Hono (integrated with React Router via `hono-react-router-adapter`)
- **Deployment**: Cloudflare Workers
- **Build**: Vite with React Router plugin

### Key Architecture Pattern

The app uses a hybrid architecture where Hono serves as both the API backend and React Router middleware:

```
worker.ts (entry point)
    └── hono-react-router-adapter/cloudflare-workers
        ├── server/index.ts (Hono API routes: /api, /events, /calendar/ics)
        └── build/server (React Router SSR)
```

### Directory Structure

- `app/` - React application code
  - `routes/` - React Router file-based routes
  - `components/` - UI components
  - `composables/` - Custom hooks (useEvents, useICSDownload, useScheduleShare, etc.)
  - `hooks/` - Additional React hooks
- `server/` - Hono API backend
  - `index.ts` - API route definitions
  - `controller.ts` - ICS generation logic
  - `constants.ts` - Event data (EVENTS array)
- `load-context.ts` - Shared context between Hono and React Router

### Data Flow

1. Events are fetched from `/events` API endpoint (defined in `server/controller.ts`)
2. Event data is stored in `server/constants.ts` as EVENTS array
3. Users select schedules in the UI
4. Selected schedules are sent to `/calendar/ics` or `/calendar/cancel-ics` to generate ICS files
5. Schedule sharing uses LZ-string compression in URL query params

### Type System

The core types are defined in `app/components/types.ts`:
- `Event` - Full event data with schedules, floor, platform info
- `Schedule` - Date and time information
- `SelectedSchedule` - User's selection (uid + schedule)
- `createEventKey` - Generates unique keys for schedule selection

### Path Aliases

The project uses `~/` alias pointing to `./app/` directory (configured in tsconfig.json).
