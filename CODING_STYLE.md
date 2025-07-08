# Superlytics Coding Style Guide

## File Naming & Structure

### Components
- **Files**: `ComponentName.tsx` + `ComponentName.module.css`
- **Pages**: `page.tsx` (App Router), `layout.tsx` for layouts
- **Hooks**: `useHookName.ts` in `/components/hooks/`
- **Utilities**: `kebab-case.ts` for multi-word utilities

### Directories
- Co-locate related files (component + styles)
- Use feature-based organization for complex areas
- Index files for clean re-exports

## Component Patterns

### Function Component Structure
```typescript
export function ComponentName({
  prop1,
  prop2 = defaultValue,
  ...otherProps
}: ComponentProps) {
  // 1. Hooks first
  const { data, isLoading } = useQuery();
  const { formatMessage } = useMessages();
  
  // 2. Derived state/computed values
  const filteredData = useMemo(() => {}, [data]);
  
  // 3. Event handlers
  const handleClick = useCallback(() => {}, []);
  
  // 4. Early returns for loading/error states
  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage />;
  
  // 5. Main render
  return (
    <div className={styles.container}>
      {/* content */}
    </div>
  );
}

export default ComponentName;
```

### Props Interface
```typescript
export interface ComponentNameProps {
  required: string;
  optional?: number;
  children?: ReactNode;
  onAction?: (value: string) => void;
}
```

## Import Organization
```typescript
// 1. External libraries
import { ReactNode } from 'react';
import classNames from 'classnames';

// 2. Internal utilities/hooks
import { useMessages } from '@/components/hooks';

// 3. Internal components
import Loading from '@/components/common/Loading';

// 4. Styles last
import styles from './Component.module.css';
```

## CSS Modules

### Class Naming
- **camelCase**: `.container`, `.headerActions`, `.loadingState`
- **Descriptive**: Avoid abbreviations, use clear names
- **No nesting**: Keep flat structure

### Structure
```css
.container {
  /* layout properties first */
  display: flex;
  position: relative;
  
  /* spacing */
  padding: 20px;
  margin: 0;
  
  /* visual properties */
  background: var(--gray50);
  border-radius: 4px;
}

/* Media queries after main styles */
@media only screen and (max-width: 992px) {
  .container {
    padding: 10px;
  }
}
```

## TypeScript Patterns

### Interface Definitions
- **PascalCase naming**: `UserProfile`, `QueryFilters`
- **Optional properties**: Use `?` for optional fields
- **Generic types**: `<T>` for reusable interfaces

### Type Exports
```typescript
export const ROLES = {
  admin: 'admin',
  user: 'user',
} as const;

export type Role = ObjectValues<typeof ROLES>;
```

## Database Queries

### Multi-Database Support
```typescript
export async function getWebsiteStats(
  websiteId: string,
  filters: QueryFilters
) {
  return runQuery({
    [PRISMA]: () => prismaQuery(websiteId, filters),
    [CLICKHOUSE]: () => clickhouseQuery(websiteId, filters),
  });
}
```

### Query Organization
- Group by domain: `events/`, `sessions/`, `reports/`
- Consistent parameter patterns
- Always return typed results

## API Routes

### Route Handler Structure
```typescript
export async function GET(request: Request) {
  // 1. Schema validation
  const schema = z.object({
    websiteId: z.string(),
    ...pagingParams,
  });
  
  // 2. Parse and validate
  const { auth, query, error } = await parseRequest(request, schema);
  
  if (error) {
    return error();
  }
  
  // 3. Authorization check
  if (!(await canViewWebsite(auth, query.websiteId))) {
    return unauthorized();
  }
  
  // 4. Execute query
  const data = await getWebsiteData(query.websiteId, query);
  
  return json(data);
}
```

## Error Handling

### Component Level
```typescript
const { data, isLoading, error } = useQuery();

if (error) return <ErrorMessage />;
if (isLoading) return <Loading />;
```

### API Level
- Use Zod for validation
- Consistent error response format
- Always check authentication first

## State Management

### React Query
- Use for server state
- Consistent cache key patterns: `['entity:action', params]`
- Enable queries conditionally

### Zustand
- Use for client state
- Keep stores focused and minimal
- Name actions clearly

## Naming Conventions

### Variables
- **camelCase**: `userData`, `isLoading`, `handleClick`
- **Boolean prefixes**: `is`, `has`, `can`, `should`
- **Event handlers**: `handle` + action (`handleSubmit`)

### Constants
- **SCREAMING_SNAKE_CASE**: `DEFAULT_PAGE_SIZE`, `API_ENDPOINTS`
- **Objects**: PascalCase with `as const`

### Functions
- **Verbs first**: `getUserData`, `validateForm`, `parseFilters`
- **Pure functions**: No side effects when possible
- **Single responsibility**: One clear purpose per function

## Key Rules

1. **Always use TypeScript** - No `any` types unless absolutely necessary
2. **CSS Modules only** - No global styles except variables
3. **Multi-database support** - Use `runQuery()` abstraction
4. **Component co-location** - Keep related files together
5. **Error boundaries** - Handle loading and error states
6. **Responsive design** - Mobile-first CSS approach
7. **Accessibility** - Use semantic HTML and ARIA when needed
8. **Performance** - Use `useMemo`/`useCallback` for expensive operations