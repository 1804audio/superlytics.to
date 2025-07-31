# Superlytics Authentication System Specification

## Document Information

- **Document Title**: Superlytics Authentication System Technical Specification
- **Version**: 1.0
- **Date**: July 2025
- **Project**: Superlytics - Privacy-Focused Web Analytics SaaS
- **Technology Stack**: Next.js 15.4.2, TypeScript, Prisma, PostgreSQL/ClickHouse

---

## Table of Contents

1. [Authentication Architecture Overview](#authentication-architecture-overview)
2. [Database Schema Specification](#database-schema-specification)
3. [Authentication Flow & Security](#authentication-flow--security)
4. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
5. [Authorization Functions](#authorization-functions)
6. [Client-Side Authentication](#client-side-authentication)
7. [Route Protection Strategy](#route-protection-strategy)
8. [Security Features](#security-features)
9. [Multi-Database Support](#multi-database-support)
10. [API Endpoints](#api-endpoints)
11. [Configuration & Constants](#configuration--constants)
12. [Testing Coverage](#testing-coverage)
13. [Scalability Considerations](#scalability-considerations)

---

## Authentication Architecture Overview

Superlytics implements a sophisticated JWT-based authentication system with multi-tenancy support, designed for a privacy-focused web analytics SaaS platform. The system supports both individual user accounts and team-based collaboration with granular role-based access control.

### Key Features
- **JWT-based Authentication** with encrypted tokens
- **Multi-tenant Architecture** supporting teams and individual users
- **Role-Based Access Control (RBAC)** with 7 distinct roles
- **Dual Authentication Modes**: Redis-backed sessions and direct JWT
- **Share Token System** for public analytics access
- **Enterprise-grade Security** with AES-256-GCM encryption
- **Database Architecture** with PostgreSQL and ClickHouse for analytics

---

## Database Schema Specification

### User Model
**Location**: `prisma/schema.prisma:11-28`

```prisma
model User {
  id          String    @id @unique @map("user_id") @db.Uuid
  username    String    @unique @db.VarChar(255)
  password    String    @db.VarChar(60)
  role        String    @map("role") @db.VarChar(50)
  logoUrl     String?   @map("logo_url") @db.VarChar(2183)
  displayName String?   @map("display_name") @db.VarChar(255)
  createdAt   DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime? @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)

  websiteUser       Website[]  @relation("user")
  websiteCreateUser Website[]  @relation("createUser")
  teamUser          TeamUser[]
  report            Report[]

  @@map("user")
}
```

#### Field Specifications
- **Primary Key**: UUID-based `user_id` for enhanced security and distributed system compatibility
- **Authentication Fields**: 
  - `username`: Unique identifier, VARCHAR(255), case-sensitive
  - `password`: bcrypt hash with 10 salt rounds, VARCHAR(60)
  - `role`: Global role assignment, VARCHAR(50)
- **Profile Fields**: 
  - `displayName`: User-friendly name display, optional
  - `logoUrl`: Avatar/profile image URL, supports data URLs up to 2183 characters
- **Audit Trail**: 
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last modification timestamp
  - `deletedAt`: Soft deletion timestamp (NULL = active user)

### Team Model
**Location**: `prisma/schema.prisma:182-195`

```prisma
model Team {
  id         String    @id() @unique() @map("team_id") @db.Uuid
  name       String    @db.VarChar(50)
  accessCode String?   @unique @map("access_code") @db.VarChar(50)
  logoUrl    String?   @map("logo_url") @db.VarChar(2183)
  createdAt  DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime? @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt  DateTime? @map("deleted_at") @db.Timestamptz(6)

  website  Website[]
  teamUser TeamUser[]

  @@index([accessCode])
  @@map("team")
}
```

### TeamUser Junction Model
**Location**: `prisma/schema.prisma:198-212`

```prisma
model TeamUser {
  id        String    @id() @unique() @map("team_user_id") @db.Uuid
  teamId    String    @map("team_id") @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  role      String    @map("role") @db.VarChar(50)
  createdAt DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime? @updatedAt @map("updated_at") @db.Timestamptz(6)

  team Team @relation(fields: [teamId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@index([teamId])
  @@index([userId])
  @@map("team_user")
}
```

#### Multi-Tenancy Design
- **Team Independence**: Each team operates as an isolated tenant
- **Role Inheritance**: Team roles can override global user roles
- **Access Code System**: Optional invitation codes for team joining
- **Resource Ownership**: Websites can belong to users or teams

---

## Authentication Flow & Security

### 1. Login Process
**Location**: `src/app/api/auth/login/route.ts:12-46`

#### Request Flow
1. **Input Validation**: Zod schema validates username/password format
2. **User Lookup**: `getUserByUsername()` retrieves user with hashed password
3. **Password Verification**: bcrypt comparison using `checkPassword()`
4. **Token Generation**: Dual-mode authentication based on Redis availability
5. **Response Formation**: Returns JWT token + sanitized user object

#### Code Implementation
```typescript
export async function POST(request: Request) {
  const schema = z.object({
    username: z.string(),
    password: z.string(),
  });

  const { body, error } = await parseRequest(request, schema, { skipAuth: true });
  
  if (error) return error();

  const { username, password } = body;
  const user = await getUserByUsername(username, { includePassword: true });

  if (!user || !checkPassword(password, user.password)) {
    return unauthorized('message.incorrect-username-password');
  }

  const { id, role, createdAt } = user;
  let token: string;

  if (redis.enabled) {
    token = await saveAuth({ userId: id, role });
  } else {
    token = createSecureToken({ userId: user.id, role }, secret());
  }

  return json({
    token,
    user: { id, username, role, createdAt, isAdmin: role === ROLES.admin },
  });
}
```

### 2. Token Security
**Location**: `src/lib/jwt.ts` & `src/lib/crypto.ts`

#### Encryption Specifications
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 10,000 iterations using SHA-512
- **Components**:
  - 64-byte random salt
  - 16-byte initialization vector (IV)
  - 16-byte authentication tag
  - Variable-length encrypted payload
- **Encoding**: Base64 for HTTP transport
- **Secret Source**: `APP_SECRET` environment variable or `DATABASE_URL` hash

#### Secure Token Creation
```typescript
export function createSecureToken(payload: any, secret: any, options?: any) {
  return encrypt(createToken(payload, secret, options), secret);
}

export function encrypt(value: any, secret: any) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(secret, salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}
```

### 3. Session Management
**Location**: `src/lib/auth.ts:24-62`

#### Request Authentication
```typescript
export async function checkAuth(request: Request) {
  const token = request.headers.get('authorization')?.split(' ')?.[1];
  const payload = parseSecureToken(token, secret());
  const shareToken = await parseShareToken(request.headers);

  let user = null;
  const { userId, authKey, grant } = payload || {};

  if (userId) {
    user = await getUser(userId);
  } else if (redis.enabled && authKey) {
    const key = await redis.client.get(authKey);
    if (key?.userId) {
      user = await getUser(key.userId);
    }
  }

  if (!user?.id && !shareToken) {
    return null;
  }

  if (user) {
    user.isAdmin = user.role === ROLES.admin;
  }

  return { user, grant, token, shareToken, authKey };
}
```

#### Authentication Modes
1. **Direct JWT Mode**: User data embedded in encrypted token
2. **Redis Session Mode**: Token contains session key, user data in Redis
3. **Share Token Mode**: Public access tokens for analytics sharing

---

## Role-Based Access Control (RBAC)

### Role Hierarchy
**Location**: `src/lib/constants.ts:141-194`

#### Global Roles
```typescript
export const ROLES = {
  admin: 'admin',           // Full system access
  user: 'user',            // Standard user with creation rights
  viewOnly: 'view-only',   // Read-only system access
  teamOwner: 'team-owner',        // Full team management
  teamManager: 'team-manager',    // Team updates + website management
  teamMember: 'team-member',      // Website management within team
  teamViewOnly: 'team-view-only', // Read-only team access
} as const;
```

#### Permission System
```typescript
export const PERMISSIONS = {
  all: 'all',
  websiteCreate: 'website:create',
  websiteUpdate: 'website:update',
  websiteDelete: 'website:delete',
  websiteTransferToTeam: 'website:transfer-to-team',
  websiteTransferToUser: 'website:transfer-to-user',
  teamCreate: 'team:create',
  teamUpdate: 'team:update',
  teamDelete: 'team:delete',
} as const;
```

#### Role-Permission Mapping
```typescript
export const ROLE_PERMISSIONS = {
  [ROLES.admin]: [PERMISSIONS.all],
  [ROLES.user]: [
    PERMISSIONS.websiteCreate,
    PERMISSIONS.websiteUpdate,
    PERMISSIONS.websiteDelete,
    PERMISSIONS.teamCreate,
  ],
  [ROLES.viewOnly]: [],
  [ROLES.teamOwner]: [
    PERMISSIONS.teamUpdate,
    PERMISSIONS.teamDelete,
    PERMISSIONS.websiteCreate,
    PERMISSIONS.websiteUpdate,
    PERMISSIONS.websiteDelete,
    PERMISSIONS.websiteTransferToTeam,
    PERMISSIONS.websiteTransferToUser,
  ],
  [ROLES.teamManager]: [
    PERMISSIONS.teamUpdate,
    PERMISSIONS.websiteCreate,
    PERMISSIONS.websiteUpdate,
    PERMISSIONS.websiteDelete,
    PERMISSIONS.websiteTransferToTeam,
  ],
  [ROLES.teamMember]: [
    PERMISSIONS.websiteCreate,
    PERMISSIONS.websiteUpdate,
    PERMISSIONS.websiteDelete,
  ],
  [ROLES.teamViewOnly]: [],
} as const;
```

### Permission Evaluation
**Location**: `src/lib/auth.ts:319-321`

```typescript
export async function hasPermission(role: string, permission: string | string[]) {
  return ensureArray(permission).some(e => ROLE_PERMISSIONS[role]?.includes(e));
}
```

---

## Authorization Functions

### Resource-Level Authorization
**Location**: `src/lib/auth.ts:87-321`

#### Website Access Control
```typescript
export async function canViewWebsite({ user, shareToken }: Auth, websiteId: string) {
  if (user?.isAdmin) return true;
  if (shareToken?.websiteId === websiteId) return true;
  
  const website = await getWebsite(websiteId);
  
  if (website.userId) {
    return user.id === website.userId;
  }
  
  if (website.teamId) {
    const teamUser = await getTeamUser(website.teamId, user.id);
    return !!teamUser;
  }
  
  return false;
}
```

#### Team Management Authorization
```typescript
export async function canUpdateTeam({ user, grant }: Auth, teamId: string) {
  if (user.isAdmin) return true;
  
  if (cloudMode) {
    return !!grant?.find(a => a === PERMISSIONS.teamUpdate);
  }
  
  const teamUser = await getTeamUser(teamId, user.id);
  return teamUser && hasPermission(teamUser.role, PERMISSIONS.teamUpdate);
}
```

#### Multi-Tenant Logic
- **Individual Ownership**: Direct user-resource relationship via `userId`
- **Team Ownership**: Team membership + role-based permissions
- **Permission Inheritance**: Team roles determine access within team context
- **Admin Override**: Admin role bypasses all ownership checks

### Authorization Matrix

| Role | Website Create | Website Update | Website Delete | Team Create | Team Update | Team Delete |
|------|---------------|---------------|---------------|-------------|-------------|-------------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| user | ✅ | ✅* | ✅* | ✅ | ❌ | ❌ |
| viewOnly | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| teamOwner | ✅ | ✅* | ✅* | ❌ | ✅* | ✅* |
| teamManager | ✅ | ✅* | ✅* | ❌ | ✅* | ❌ |
| teamMember | ✅ | ✅* | ✅* | ❌ | ❌ | ❌ |
| teamViewOnly | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*\* Within owned resources or team context*

---

## Client-Side Authentication

### Authentication State Management
**Location**: `src/store/app.ts:22-62`

#### Zustand Store Configuration
```typescript
const initialState = {
  locale: getItem(LOCALE_CONFIG) || DEFAULT_LOCALE,
  theme: getItem(THEME_CONFIG) || getDefaultTheme() || DEFAULT_THEME,
  timezone: getItem(TIMEZONE_CONFIG) || getTimezone(),
  dateRange: getItem(DATE_RANGE_CONFIG) || DEFAULT_DATE_RANGE,
  shareToken: null,
  user: null,
  config: null,
};

const store = create(() => ({ ...initialState }));
```

#### State Management Functions
```typescript
export function setUser(user: object) {
  store.setState({ user });
}

export function setShareToken(shareToken: string) {
  store.setState({ shareToken });
}
```

### Login Hook Implementation
**Location**: `src/components/hooks/queries/useLogin.ts:7-29`

```typescript
export function useLogin(): {
  user: any;
  setUser: (data: any) => void;
} & UseQueryResult {
  const { post, useQuery } = useApi();
  const user = useStore(selector);

  const query = useQuery({
    queryKey: ['login'],
    queryFn: async () => {
      const data = await post('/auth/verify');
      setUser(data);
      return data;
    },
    enabled: !user,
  });

  return { user, setUser, ...query };
}
```

#### Features
- **TanStack Query Integration**: Automatic caching and refetching
- **Conditional Execution**: Only runs when no user in store
- **State Synchronization**: Updates Zustand store with verified user
- **Error Handling**: Automatic retry and error states

### Login Form Component
**Location**: `src/app/login/LoginForm.tsx:18-82`

```typescript
export function LoginForm() {
  const { formatMessage, labels, getMessage } = useMessages();
  const router = useRouter();
  const { post, useMutation } = useApi();
  
  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/auth/login', data),
  });

  const handleSubmit = async (data: any) => {
    mutate(data, {
      onSuccess: async ({ token, user }) => {
        setClientAuthToken(token);
        setUser(user);
        router.push('/dashboard');
      },
    });
  };

  return (
    <div className={styles.login}>
      <Icon className={styles.icon} size="xl">
        <Logo />
      </Icon>
      <div className={styles.title}>superlytics</div>
      <Form
        className={styles.form}
        onSubmit={handleSubmit}
        error={getMessage(error)}
        values={{ username: '', password: '' }}
      >
        {/* Form fields */}
      </Form>
    </div>
  );
}
```

---

## Route Protection Strategy

### App Router Protection Pattern
**Location**: `src/app/(main)/layout.tsx` & `App.tsx`

#### Layout Group Structure
```
src/app/
├── (main)/                 # Protected routes group
│   ├── dashboard/
│   ├── websites/
│   ├── teams/
│   ├── reports/
│   ├── settings/
│   └── layout.tsx         # Contains App component with auth guard
├── login/                 # Public route
├── logout/               # Public route
├── sso/                  # Public route
└── share/               # Public route with share tokens
```

#### Authentication Guard Component
```typescript
export function App({ children }: { children: ReactNode }) {
  const { user, isLoading, error } = useLogin();
  const { data: config } = useConfig();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    window.location.href = `${process.env.basePath || ''}/login`;
  }

  if (!user || !config) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <NavBar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
```

#### Protection Flow
1. User accesses protected route under `(main)/`
2. `App.tsx` component renders and executes `useLogin()` hook
3. Hook makes request to `/api/auth/verify` to validate session
4. If authentication fails, redirects to `/login`
5. If successful, renders protected content with navigation

### API Protection Middleware
**Location**: `src/lib/request.ts:16-58`

```typescript
export async function parseRequest(
  request: Request,
  schema?: ZodSchema,
  options?: { skipAuth: boolean },
): Promise<any> {
  const url = new URL(request.url);
  let query = Object.fromEntries(url.searchParams);
  let body = await getJsonBody(request);
  let error: () => void | undefined;
  let auth = null;

  // Schema validation...

  if (!options?.skipAuth && !error) {
    auth = await checkAuth(request);
    
    if (!auth) {
      error = () => unauthorized();
    }
  }

  return { url, query, body, auth, error };
}
```

#### Universal API Protection
- **Automatic Authentication**: All API routes protected by default
- **Skip Auth Option**: Public endpoints (login, share) bypass authentication
- **Standardized Responses**: Consistent 401 unauthorized responses
- **Request Context**: Auth object available to all protected routes

---

## Security Features

### Password Security
**Location**: `src/lib/auth.ts:16-22`

```typescript
const SALT_ROUNDS = 10;

export function hashPassword(password: string, rounds = SALT_ROUNDS) {
  return bcrypt.hashSync(password, rounds);
}

export function checkPassword(password: string, passwordHash: string) {
  return bcrypt.compareSync(password, passwordHash);
}
```

#### Specifications
- **bcryptjs Library**: Industry-standard password hashing
- **Salt Rounds**: 10 rounds (configurable)
- **No Plain Text**: Passwords never stored or transmitted in clear text
- **Constant-Time Comparison**: Secure verification prevents timing attacks

### Token Security Features

#### Encryption Specifications
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Random Components**: Cryptographically secure random salt and IV
- **Authentication**: Built-in authentication tag prevents tampering
- **Transport**: Base64 encoding for HTTP compatibility

#### CSRF Protection
- **Token-Based**: JWT tokens prevent CSRF attacks
- **Bearer Authentication**: Authorization header pattern
- **Same-Origin Enforcement**: Client-side token storage

### Data Protection

#### Soft Deletion
```typescript
// User model includes deletedAt timestamp
deletedAt DateTime? @map("deleted_at") @db.Timestamptz(6)
```

#### Audit Logging
- **Creation Timestamps**: All entities track creation time
- **Update Timestamps**: Automatic modification tracking
- **Development Logging**: Comprehensive auth debugging in development mode

#### Access Logging
```typescript
if (process.env.NODE_ENV === 'development') {
  log('checkAuth:', { token, shareToken, payload, user, grant });
}
```

---

## Multi-Database Support

### Database Compatibility
**Location**: `prisma/schema.prisma` (multiple database schemas)

#### Supported Databases
- **PostgreSQL**: Primary production database
- **ClickHouse**: Analytics-optimized database

#### Schema Consistency
- **Prisma ORM**: Database-agnostic query interface
- **Migration Support**: Database-specific migrations in `db/` directory
- **Type Safety**: Generated TypeScript types for all databases

#### Database Detection
**Location**: `src/lib/db.ts`

```typescript
export function getDatabaseType() {
  const url = process.env.DATABASE_URL;
  
  if (url?.startsWith('postgresql://') || url?.startsWith('postgres://')) {
    return 'postgresql';
  }
  if (url?.includes('clickhouse')) {
    return 'clickhouse';
  }
  
  return 'postgresql'; // default
}
```

---

## API Endpoints

### Authentication Endpoints

#### Login Endpoint
**Location**: `src/app/api/auth/login/route.ts`
- **Method**: POST
- **URL**: `/api/auth/login`
- **Body**: `{ username: string, password: string }`
- **Response**: `{ token: string, user: UserObject }`
- **Authentication**: None (skipAuth: true)

#### Verification Endpoint
**Location**: `src/app/api/auth/verify/route.ts`
- **Method**: POST
- **URL**: `/api/auth/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `UserObject`
- **Authentication**: Required

#### Logout Endpoint
**Location**: `src/app/api/auth/logout/route.ts`
- **Method**: POST
- **URL**: `/api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true }`
- **Side Effect**: Deletes Redis session if enabled

#### SSO Endpoint
**Location**: `src/app/api/auth/sso/route.ts`
- **Method**: POST/GET
- **URL**: `/api/auth/sso`
- **Purpose**: Single Sign-On authentication
- **Response**: Temporary auth tokens with expiration

### Protected API Routes

#### User Management
- **GET/POST** `/api/users` - List/create users (admin only)
- **PUT/DELETE** `/api/users/[id]` - Update/delete user (admin only)

#### Team Management
- **GET/POST** `/api/teams` - List/create teams
- **PUT/DELETE** `/api/teams/[id]` - Update/delete team (role-based)

#### Website Management
- **GET/POST** `/api/websites` - List/create websites
- **PUT/DELETE** `/api/websites/[id]` - Update/delete website (ownership-based)

---

## Configuration & Constants

### Authentication Constants
**Location**: `src/lib/constants.ts:2-9`

```typescript
export const AUTH_TOKEN = 'superlytics.auth';
export const SHARE_TOKEN_HEADER = 'x-superlytics-share-token';
```

### Environment Variables

#### Required Variables
- `DATABASE_URL`: Primary database connection string
- `APP_SECRET`: Encryption secret key (optional, defaults to DATABASE_URL hash)

#### Optional Variables
- `CLICKHOUSE_URL`: ClickHouse database connection for analytics
- `CLOUD_MODE`: Enables cloud-specific features and restrictions
- `NODE_ENV`: Environment mode (development enables debug logging)

### Redis Configuration
**Location**: `src/lib/redis.ts`

```typescript
const redis = {
  enabled: !!process.env.REDIS_URL,
  client: process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null,
};
```

---

## Testing Coverage

### End-to-End Tests
**Location**: `cypress/e2e/`

#### Authentication Tests
- **login.cy.ts**: Login form functionality and validation
- **user.cy.ts**: User management interface tests
- **api-user.cy.ts**: User API endpoint tests

#### Test Data
**Location**: `cypress/fixtures/`
- **users.json**: Test user accounts and credentials
- **teams.json**: Test team configurations
- **websites.json**: Test website data

### Unit Tests
**Location**: `src/lib/__tests__/`

#### Covered Areas
- **charts.test.ts**: Chart rendering and data processing
- **detect.test.ts**: User agent detection and parsing
- **format.test.ts**: Data formatting and display functions

---

## Scalability Considerations

### Session Management

#### Redis Integration
- **Distributed Sessions**: Redis enables horizontal scaling
- **Session Persistence**: Survives application restarts
- **Configurable Expiration**: TTL support for session management
- **Fallback Mode**: Direct JWT when Redis unavailable

#### Performance Optimizations
- **Database Indexing**: Strategic indexes on user lookups and team relationships
- **Query Optimization**: Efficient team membership and permission checks
- **Caching Strategy**: Client-side caching of user state and permissions

### Security Scalability

#### Token Management
- **Stateless JWT**: Reduces server-side session storage requirements
- **Encrypted Tokens**: Secure even if token storage is compromised
- **Short-Lived Sessions**: Configurable expiration for security/usability balance

#### Database Optimization
- **Connection Pooling**: Prisma handles database connection management
- **Multi-Database Support**: Horizontal scaling across different database types
- **Soft Deletion**: Maintains referential integrity without hard deletes

---

## Implementation Files Reference

### Core Authentication Files
- `src/lib/auth.ts` - Main authentication and authorization logic
- `src/lib/jwt.ts` - JWT token creation and parsing utilities
- `src/lib/crypto.ts` - Cryptographic functions and encryption
- `src/lib/request.ts` - Request parsing and authentication middleware
- `src/lib/client.ts` - Client-side token management

### Database Schema Files
- `prisma/schema.prisma` - Main Prisma schema with user models
- `db/postgresql/schema.prisma` - PostgreSQL-specific schema

### API Route Files
- `src/app/api/auth/login/route.ts` - Login endpoint
- `src/app/api/auth/verify/route.ts` - Token verification endpoint
- `src/app/api/auth/logout/route.ts` - Logout endpoint
- `src/app/api/auth/sso/route.ts` - SSO authentication endpoint

### Client Components
- `src/app/login/LoginForm.tsx` - React login form component
- `src/components/hooks/queries/useLogin.ts` - Authentication hook
- `src/store/app.ts` - Zustand state management for authentication

### Configuration Files
- `src/lib/constants.ts` - Authentication constants and role definitions
- `src/lib/types.ts` - TypeScript type definitions

---

## Conclusion

The Superlytics authentication system provides enterprise-grade security with comprehensive multi-tenancy support. The architecture balances security, scalability, and usability while maintaining the privacy-focused principles of the platform. The system is designed to support both small teams and large organizations with granular permission controls and flexible deployment options.

The dual-mode authentication (Redis + JWT) provides deployment flexibility, while the role-based access control system ensures proper data isolation and permission management across different organizational structures.

---

*This specification document covers the complete authentication implementation in Superlytics as of July 2025. For implementation details and code examples, refer to the referenced source files in the codebase.*