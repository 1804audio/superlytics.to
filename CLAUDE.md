# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Superlytics is built with Next.js 15, React 19, and TypeScript. It supports multiple databases (PostgreSQL, MySQL, ClickHouse).

- **Simplicity First**: Choose the simplest solution that works - avoid over-engineering

## Development Commands

### Essential Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server on port 3000
- `npm run build` - Full production build (includes database setup, tracker, and app)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests

### Database Commands

- `npm run build-db` - Build database schema and generate Prisma client
- `npm run update-db` - Apply database migrations
- `npm run check-db` - Verify database connection and schema

### Testing Commands

- `npm run test` - Run unit tests with Jest
- `npm run cypress-open` - Open Cypress for e2e tests
- `npm run cypress-run` - Run Cypress tests headlessly

### Build Commands

- `npm run build-tracker` - Build analytics tracking script
- `npm run build-components` - Build React components library
- `npm run build-geo` - Build geographical data mappings

## Architecture

### Database Layer

- **Multi-database support**: PostgreSQL, MySQL, ClickHouse
- **Prisma ORM**: Primary database abstraction for PostgreSQL/MySQL
- **ClickHouse**: High-performance analytics database for large-scale deployments
- **Query abstraction**: `src/lib/db.ts` provides unified query interface via `runQuery()`

### Application Structure

- **Next.js App Router**: Modern routing with `src/app/` directory
- **Route Groups**: Main app in `(main)/` group
- **API Routes**: RESTful endpoints in `src/app/api/`
- **Components**: Reusable UI components in `src/components/`
- **Queries**: Database queries organized by type in `src/queries/`

### Key Architectural Patterns

- **Database-agnostic queries**: Each query function supports multiple databases
- **Layered architecture**: API routes → queries → database adapters
- **Module CSS**: Component-scoped styling with `.module.css` files
- **TypeScript**: Full type safety across the application

### Data Flow

1. Analytics data collected via tracking script (`src/tracker/`)
2. Data sent to `/api/send` endpoint
3. Stored in database via appropriate query functions
4. Retrieved and displayed through dashboard components

### Query Organization

- `src/queries/prisma/` - Prisma-based queries for PostgreSQL/MySQL
- `src/queries/sql/` - Raw SQL queries organized by domain:
  - `events/` - Event tracking and retrieval
  - `sessions/` - Session management
  - `reports/` - Analytics reports (funnel, retention, etc.)
  - `pageviews/` - Page view analytics

### State Management

- **Zustand**: Lightweight state management in `src/store/`
- **React Query**: Server state management with `@tanstack/react-query`
- **Local storage**: Client-side persistence for user preferences

## Development Guidelines

### Database Queries

- Always use the `runQuery()` function from `src/lib/db.ts`
- Support all database types (PostgreSQL, MySQL, ClickHouse)
- Use parameterized queries to prevent SQL injection
- Follow the existing query organization pattern

### Component Development

- Use TypeScript for all components
- Follow the existing CSS Modules pattern
- Implement proper error boundaries
- Use React hooks for state management

### API Development

- Follow RESTful conventions
- Use Next.js Route Handlers in `src/app/api/`
- Implement proper error handling and validation
- Support pagination for list endpoints

### Testing

- Unit tests in `src/lib/__tests__/`
- Follow existing test patterns
- Use Jest for unit testing
- Use Cypress for e2e testing

## Environment Setup

### Required Environment Variables

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `CLICKHOUSE_URL` - ClickHouse connection (optional)
- `REDIS_URL` - Redis connection (optional)

### Development Database

The build process will create database tables automatically on first run and create a default admin user (username: `admin`, password: `superlytics`).

## Key Files and Directories

### Configuration

- `next.config.mjs` - Next.js configuration with security headers
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `db/` - Database schemas and migrations

### Core Application

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable UI components
- `src/lib/` - Core utilities and database abstractions
- `src/queries/` - Database query functions
- `src/store/` - State management
- `src/tracker/` - Analytics tracking script

### Assets and Localization

- `src/assets/` - SVG icons and images
- `src/lang/` - Internationalization files
- `public/intl/` - Compiled localization data
