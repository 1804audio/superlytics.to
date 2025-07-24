# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Superlytics is a privacy-focused web analytics SaaS platform built with Next.js. It provides a modern alternative to Google Analytics with support for multiple databases (PostgreSQL, MySQL, ClickHouse) and comprehensive analytics features.

## Technology Stack

- **Framework**: Next.js 15.4.2 with App Router
- **Language**: TypeScript with strict mode
- **Package Manager**: PNPM (note: pnpm-lock.yaml and pnpm-workspace.yaml present)
- **Database**: Multi-database support (PostgreSQL, MySQL, ClickHouse via Prisma)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: CSS Modules + React Basics component library
- **Charts**: Chart.js with date-fns adapter
- **Testing**: Jest with TypeScript support
- **E2E Testing**: Cypress

## Common Development Commands

```bash
# Development
npm run dev              # Start development server
npm run dev-turbo        # Start with turbopack (faster)

# Building
npm run build            # Full build with env checks, DB setup, tracker, geo data
npm run build-app        # Build Next.js app only
npm run build-tracker    # Build tracking script
npm run build-db         # Database setup and client generation

# Database
npm run update-db        # Run Prisma migrations
npm run build-db-client  # Generate Prisma client
npm run check-db         # Verify database connection

# Code Quality
npm run lint            # ESLint (quiet mode)
npm run test            # Jest tests

# Other Utilities
npm run check-env       # Verify environment variables
npm run build-lang      # Process internationalization files
```

## Architecture Overview

### App Structure (Next.js App Router)
- `src/app/` - Next.js App Router pages and API routes
- `src/app/(main)/` - Main application pages with shared layout
- `src/app/api/` - API routes for data operations
- `src/components/` - Reusable UI components organized by category
- `src/lib/` - Core utilities and business logic
- `src/queries/` - Database queries (Prisma and raw SQL)
- `src/store/` - Zustand state management

### Key Components Architecture
- **Charts**: Custom Chart.js implementations in `src/components/charts/`
- **Metrics**: Analytics tables and visualizations in `src/components/metrics/`
- **Reports**: Advanced analytics reports with parameters and filtering
- **Hooks**: Custom React hooks for data fetching and state management

### Database Layer
- **Multi-database support**: Automatic detection via `getDatabaseType()` in `src/lib/db.ts`
- **Prisma**: Primary ORM for schema management
- **Raw SQL**: Performance-critical queries in `src/queries/sql/`
- **Migrations**: Database-specific migrations in `db/` directory

### Data Collection
- **Tracker**: Custom analytics script built with Rollup (`src/tracker/`)
- **Events**: Event collection and processing pipeline
- **Sessions**: Session management and analytics
- **Real-time**: Live visitor tracking and analytics

## Code Style and Configuration

- **Prettier**: arrowParens: avoid, singleQuote: true, trailingComma: all, printWidth: 100
- **ESLint**: Extends Next.js, TypeScript, and Prettier configs
- **TypeScript**: Strict mode with path aliases (`@/*` maps to `src/*`)
- **CSS Modules**: Component-scoped styling with `.module.css` files

## Database Considerations

The application supports multiple database backends. When working with queries:
- Use `src/lib/db.ts` functions for database-agnostic operations
- Database-specific queries are organized in `src/queries/sql/`
- Prisma client is generated via `npm run build-db-client`
- Check database connection with `npm run check-db`

## Environment Setup

Essential environment variables (see `scripts/check-env.js` for validation):
- `DATABASE_URL` - Primary database connection
- Optional: `CLICKHOUSE_URL` for ClickHouse analytics backend
- Optional: Various feature flags and configuration options

## Internationalization

The project supports 45+ languages with files in:
- `src/lang/` - Source translation files  
- `public/intl/` - Compiled translation files
- Build process: `npm run build-lang` compiles and formats translations

## Testing

- **Unit tests**: Jest configuration in `jest.config.ts`
- **E2E tests**: Cypress with configuration in `cypress.config.ts`
- **Test location**: `src/lib/__tests__/` for unit tests