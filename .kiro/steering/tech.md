# Technical Stack & Build System

## Core Technologies
- **Framework**: Next.js 15.4.2 with App Router
- **Runtime**: React 19.1.0 with TypeScript 5.8.3
- **Package Manager**: pnpm (workspace configuration)
- **Database**: PostgreSQL + ClickHouse (high-performance analytics)
- **ORM**: Prisma 6.12.0 with read replicas extension
- **State Management**: Zustand 5.0.6
- **Styling**: CSS Modules with PostCSS

## Key Libraries
- **UI Components**: react-basics, react-icons
- **Charts**: Chart.js 4.5.0 with date-fns adapter
- **Internationalization**: react-intl 7.1.11 (50+ languages)
- **Authentication**: bcryptjs, jsonwebtoken
- **Payments**: Stripe 18.3.0
- **Analytics**: Custom tracking system with ClickHouse
- **Caching**: Redis (@umami/redis-client)
- **Event Streaming**: KafkaJS 2.2.4
- **Validation**: Zod 3.25.76

## Build System
- **Bundler**: Next.js with Turbopack support
- **Tracker Build**: Rollup for standalone tracker script
- **Components**: Separate Rollup build for component library
- **Database**: Prisma generate and migrate
- **Internationalization**: FormatJS for message extraction and compilation

## Common Commands

### Development
```bash
npm run dev              # Start development server
npm run dev-turbo        # Start with Turbopack (port 3001)
```

### Building
```bash
npm run build           # Full production build
npm run build-docker    # Docker-optimized build
npm run build-tracker   # Build tracking script only
npm run build-components # Build component library
```

### Database
```bash
npm run update-db       # Run Prisma migrations
npm run build-db        # Generate Prisma client
npm run check-db        # Verify database connection
```

### Internationalization
```bash
npm run build-lang      # Complete language build process
npm run generate-lang   # Extract and merge messages
npm run check-lang      # Validate language files
```

### Testing & Quality
```bash
npm test               # Run Jest tests
npm run cypress-run    # Run Cypress e2e tests
npm run lint           # ESLint check
```

## Environment Requirements
- Node.js 18.18+ 
- Database: PostgreSQL 12.14+
- Redis (optional, for caching)
- ClickHouse (optional, for analytics data)

## Docker Support
- Multi-stage Dockerfile optimized for PostgreSQL
- Docker Compose with PostgreSQL setup
- Single image with PostgreSQL support