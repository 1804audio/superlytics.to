# Project Structure & Organization

## Root Directory Structure
```
├── src/                    # Main application source code
├── db/                     # Database schemas and migrations
├── prisma/                 # Prisma ORM configuration
├── public/                 # Static assets and tracker script
├── scripts/                # Build and utility scripts
├── cypress/                # End-to-end tests
├── Plan/                   # Product planning documents
├── Specs/                  # Technical specifications
└── [config files]         # Various configuration files
```

## Source Code Organization (`src/`)
- **`app/`** - Next.js App Router pages and API routes
  - `(main)/` - Main application pages with layout groups
  - `api/` - API endpoints for analytics, auth, and admin
  - `login/`, `signup/`, `logout/` - Authentication pages
- **`components/`** - Reusable React components
  - `charts/` - Analytics visualization components
  - `common/` - Shared UI components
  - `input/` - Form and input components
  - `layout/` - Layout and navigation components
  - `metrics/` - Analytics metric components
- **`lib/`** - Core business logic and utilities
  - `services/` - External service integrations
  - `middleware/` - Request/response middleware
  - `jobs/` - Background job processing
- **`queries/`** - Database queries (Prisma and raw SQL)
- **`store/`** - Zustand state management
- **`lang/`** - Internationalization files (50+ languages)
- **`tracker/`** - Client-side tracking script

## Database Structure (`db/`)
- **`postgresql/`** - PostgreSQL schema and migrations  
- **`clickhouse/`** - ClickHouse analytics schema and migrations
- Each database has its own migration system and schema files

## Key Configuration Files
- **`package.json`** - Dependencies and npm scripts
- **`next.config.mjs`** - Next.js configuration with CSP headers
- **`tsconfig.json`** - TypeScript configuration with path aliases
- **`prisma/schema.prisma`** - Database schema definition
- **`.env`** - Environment variables (use `.env.example` as template)
- **`docker-compose.yml`** - Local development with PostgreSQL
- **`cypress.config.ts`** - E2E testing configuration

## Build Artifacts & Generated Files
- **`.next/`** - Next.js build output
- **`node_modules/`** - Package dependencies
- **`public/script.js`** - Generated tracking script
- **`public/intl/`** - Compiled internationalization messages
- **`build/`** - Temporary build files

## Asset Organization (`public/`)
- **`images/`** - UI icons organized by category (browser, country, device, OS)
- **`intl/`** - Compiled language files and country data
- **`script.js`** - Main tracking script served to websites
- Static files: favicons, manifest, robots.txt

## Development Scripts (`scripts/`)
- Database utilities: `check-db.js`, `copy-db-files.js`
- Build tools: `build-geo.js`, `postbuild.js`
- Internationalization: `format-lang.js`, `merge-messages.js`
- Data utilities: `download-country-names.js`, `download-language-names.js`

## Path Aliases (TypeScript)
- `@/*` maps to `./src/*` for clean imports
- Use `@/components/...`, `@/lib/...`, etc. in imports

## Naming Conventions
- **Files**: kebab-case for components, camelCase for utilities
- **Database**: snake_case for tables and columns
- **API Routes**: RESTful naming with proper HTTP methods
- **Components**: PascalCase for React components