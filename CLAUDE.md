# SuperLytics.co Coding Standards & Best Practices

## 🎯 **Core Principles**

### **Zero Tolerance for Errors**
- **NEVER** disable ESLint rules (`eslint-disable-next-line`)
- **NEVER** take shortcuts or use placeholders
- **ALWAYS** fix issues properly, not work around them
- **ALWAYS** run `npm run lint` before considering work complete

### **Production-Grade Code Only**
- No experimental or temporary code
- Every line must be intentional and purposeful
- Follow established patterns exactly
- Maintain consistency across the entire platform
- **Simplicity First**: Choose the simplest solution that works - avoid over-engineering
- **3 Lines Better Than 10**: If you can solve it simply, do it
---

## 🏗️ **Architecture & Structure**

### **File Organization**
```
src/
├── app/
│   ├── (main)/           # Main layout routes
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/           # Reusable components
├── lib/                  # Utilities, types, config
├── queries/              # Database queries
└── styles/               # CSS modules and variables
```

### **Component Structure**
```typescript
// ✅ CORRECT: Proper imports and structure
'use client';
import { useState } from 'react';
import { useApi } from '@/components/hooks';
import { Button, Form, FormRow, FormInput } from 'react-basics';
import { useMessages } from '@/components/hooks';
import Icons from '@/components/icons';
import styles from './ComponentName.module.css';

export default function ComponentName() {
  const { formatMessage, labels } = useMessages();
  const { post } = useApi();
  const [loading, setLoading] = useState(false);

  // Component logic here
  
  return (
    <div className={styles.container}>
      {/* JSX content */}
    </div>
  );
}
```

---

## 🎨 **UI/UX Standards**

### **Design System Compliance**
- **ALWAYS** use `react-basics` components: `Button`, `Form`, `FormRow`, `FormInput`, `Modal`, `Banner`
- **NEVER** create custom components when platform components exist
- **ALWAYS** follow existing UI patterns exactly
- **NEVER** introduce new design patterns

### **Theme & Colors**
```typescript
// ✅ CORRECT: Use CSS variables for theming
style={{ color: 'var(--font-color300)' }}
style={{ backgroundColor: 'var(--base75)' }}
style={{ border: '1px solid var(--base300)' }}

// ❌ WRONG: Hardcoded colors
style={{ color: '#666' }}
style={{ backgroundColor: '#f6f8fa' }}
```

### **Layout Patterns**
```typescript
// ✅ CORRECT: Use Form/FormRow for consistent layouts
<Form onSubmit={handleSubmit} values={{ name: '' }}>
  <FormRow label="Field Label">
    <FormInput name="name" rules={{ required: 'Required field' }}>
      <TextField placeholder="Enter value" />
    </FormInput>
  </FormRow>
  <SubmitButton variant="primary" isLoading={loading}>
    Submit
  </SubmitButton>
</Form>
```

---

## 🔐 **Security & API Standards**

### **Authentication**
```typescript
// ✅ CORRECT: Always check authentication
import { getAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const auth = await getAuth(request);
  if (!auth?.user) {
    return unauthorized('Authentication required');
  }
  
  const userId = auth.user.id;
  // Continue with authenticated user
}
```

### **API Response Standards**
```typescript
// ✅ CORRECT: Consistent API responses
import { json, badRequest, forbidden, notFound } from '@/lib/api';

// Success response
return json({ success: true, message: 'Operation completed' });

// Error responses
return badRequest('Invalid input data');
return forbidden('Access denied');
return notFound('Resource not found');
```

### **Input Validation**
```typescript
// ✅ CORRECT: Always validate inputs
const { name } = await request.json();

if (!name || typeof name !== 'string') {
  return badRequest('Name is required and must be a string');
}

if (name.length > 100) {
  return badRequest('Name must be less than 100 characters');
}
```

---

## 📊 **Database & Data Management**

### **🔄 Database Migration Workflow**

**CRITICAL: Follow this exact workflow for all database changes to ensure production safety.**

#### **Development Phase**
```bash
# 1. Make schema changes in db/{database_type}/schema.prisma
# 2. Never edit prisma/schema.prisma directly - it gets overwritten
# 3. For new features requiring database changes:

# Create numbered migration folder (sequential)
mkdir db/postgresql/migrations/03_your_feature_name
mkdir db/mysql/migrations/03_your_feature_name

# Write ONLY incremental SQL changes
# Example: db/postgresql/migrations/03_your_feature_name/migration.sql
```

#### **Migration File Structure**
```sql
-- ✅ CORRECT: Only include NEW changes, not existing schema

-- AddColumn (if adding a field)
ALTER TABLE "user" ADD COLUMN "new_field" VARCHAR(255);

-- CreateTable (if adding a new table)
CREATE TABLE "new_table" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "new_table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "new_table_name_idx" ON "new_table"("name");

-- ❌ WRONG: Don't recreate existing tables or enums
-- This will cause migration conflicts in production
```

#### **Testing Workflow**
```bash
# 1. Test your migration in development
npm run build-db        # Copy files and generate client
npm run check-db        # Apply migrations and verify

# 2. Verify everything works
npm run lint           # Must pass with zero errors
npm run build          # Complete build must succeed

# 3. Test feature functionality
# 4. Test rollback scenarios if needed
```

#### **Production Deployment**
```bash
# The existing build process handles everything automatically:
npm run build
# This runs: check-env → build-db → check-db → build-tracker → build-geo → build-app

# ✅ Migration system ensures:
# - Automatic database type detection (PostgreSQL/MySQL)
# - Safe incremental migrations
# - Zero downtime deployments
# - Rollback capability if needed
```

#### **Migration Best Practices**

**✅ DO:**
- Create sequential numbered migrations (01, 02, 03...)
- Write only incremental changes in migration files
- Test thoroughly in development before production
- Use proper SQL syntax for your database type
- Add appropriate indexes for performance
- Include both PostgreSQL and MySQL versions

**❌ DON'T:**
- Edit existing migration files after they're applied
- Skip migration numbers (always sequential)
- Include entire schema in migration files
- Make breaking changes without migration path
- Deploy without testing migrations first

#### **Database File Structure**
```
db/
├── postgresql/
│   ├── migrations/
│   │   ├── 01_init/migration.sql              # Initial baseline
│   │   ├── 02_new_feature/migration.sql       # Your changes
│   │   └── migration_lock.toml
│   └── schema.prisma                          # Source of truth
└── mysql/
    ├── migrations/
    │   ├── 01_init/migration.sql              # Initial baseline  
    │   ├── 02_new_feature/migration.sql       # Your changes
    │   └── migration_lock.toml
    └── schema.prisma                          # Source of truth
```

#### **Emergency Procedures**

**Migration Conflicts:**
```bash
# If you get migration conflicts in production:
npx prisma migrate status              # Check current state
npx prisma migrate resolve --applied 02_migration_name  # Mark as applied if DB has changes
```

**Schema Drift:**
```bash
# If database and migrations are out of sync:
npx prisma db pull                     # Pull current DB state
# Review changes and create proper migration
```

### **Prisma Queries**
```typescript
// ✅ CORRECT: Proper field selection and error handling
import { prisma } from '@/lib/prisma';

export async function findUser(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        customerId: true,
        subscriptionId: true,
        subscriptionStatus: true,
        hasAccess: true,
      },
    });
  } catch (error) {
    log('Database query failed:', error);
    throw error;
  }
}
```

### **Usage Tracking**
```typescript
// ✅ CORRECT: Always track feature usage
import { usageTracker } from '@/lib/usage';

await usageTracker.trackDataExport(userId, 'full_export', 0);
await usageTracker.trackEvent(userId, 'api_key_created');
```

---

## 🔧 **Error Handling & Logging**

### **Logging Standards**
```typescript
// ✅ CORRECT: Use debug logging, never console.error
import debug from 'debug';

const log = debug('superlytics:component-name');

try {
  // Operation
} catch (error) {
  log('Operation failed:', error);
  // Handle error appropriately
}
```

### **Error Boundaries**
```typescript
// ✅ CORRECT: Proper error handling in components
const handleSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    await post('/api/endpoint', data);
    showToast({ message: 'Success!', variant: 'success' });
  } catch (error) {
    log('Submit failed:', error);
    showToast({ message: 'Operation failed', variant: 'error' });
  } finally {
    setLoading(false);
  }
};
```

---

## 🎯 **Feature Implementation Standards**

### **Plan-Based Features**
```typescript
// ✅ CORRECT: Always check plan limits and features
import { simpleUsageManager } from '@/lib/usage';
import { SIMPLIFIED_PLANS } from '@/lib/config/simplified-plans';

// Check feature access
const hasFeature = await simpleUsageManager.hasFeature(userId, 'apiKeys');
if (!hasFeature) {
  return forbidden('Feature not available in your plan');
}

// Check usage limits
const userPlan = SIMPLIFIED_PLANS[auth.user.planId || 'free'];
const limit = userPlan?.limits?.apiKeys || 0;
if (limit !== -1 && currentUsage >= limit) {
  return forbidden(`Limit reached for ${userPlan.name} plan`);
}
```

### **API Key Management**
```typescript
// ✅ CORRECT: Secure API key generation and storage
import { createSecureToken } from '@/lib/crypto';

const apiKey = createSecureToken(32);
const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(-4)}`;

// Store securely (example with in-memory map)
apiKeys.set(userId, [...userKeys, { id: keyId, name, key: apiKey, maskedKey }]);
```

---

## 🧪 **Testing & Quality Assurance**

### **Pre-Implementation Checklist**
- [ ] Component follows existing patterns
- [ ] Uses correct `react-basics` components
- [ ] Implements proper error handling
- [ ] Uses CSS variables for theming
- [ ] Validates all inputs
- [ ] Checks authentication and permissions
- [ ] Tracks usage appropriately
- [ ] Uses debug logging

### **Post-Implementation Checklist**
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` completes successfully
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] Responsive design works
- [ ] Light/dark mode compatibility
- [ ] Accessibility standards met
- [ ] **Database migrations tested and working** (if applicable)
- [ ] **Migration files created for both PostgreSQL and MySQL** (if schema changes)
- [ ] **`npm run check-db` passes without errors** (if database changes)

---

## 🚫 **Common Pitfalls to Avoid**

### **Never Do This**
```typescript
// ❌ WRONG: Disabling ESLint
// eslint-disable-next-line no-console
console.error('Error:', error);

// ❌ WRONG: Hardcoded values
style={{ color: '#666', backgroundColor: '#fff' }}

// ❌ WRONG: Custom components when platform ones exist
<div className="custom-button">Click me</div>

// ❌ WRONG: Inconsistent API responses
return { message: 'Success' }; // Missing json() wrapper

// ❌ WRONG: No error handling
const data = await fetch('/api/endpoint');
return data.json();
```

```sql
-- ❌ WRONG: Database Migration Pitfalls

-- Don't recreate existing tables/enums (causes conflicts)
CREATE TYPE "AuthTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- Don't include full schema in migration files
CREATE TABLE "user" (...); -- This already exists!

-- Don't edit prisma/schema.prisma directly
-- It gets overwritten by copy-db-files script

-- Don't skip migration numbers
-- db/postgresql/migrations/05_feature/ (if 03 and 04 don't exist)
```

### **Always Do This**
```typescript
// ✅ CORRECT: Proper logging
log('Operation failed:', error);

// ✅ CORRECT: CSS variables
style={{ color: 'var(--font-color300)' }}

// ✅ CORRECT: Platform components
<Button variant="primary">Click me</Button>

// ✅ CORRECT: Consistent API responses
return json({ success: true, message: 'Success' });

// ✅ CORRECT: Proper error handling
try {
  const data = await fetch('/api/endpoint');
  return await data.json();
} catch (error) {
  log('API call failed:', error);
  throw error;
}
```

```sql
-- ✅ CORRECT: Database Migration Best Practices

-- Create sequential numbered migrations
-- db/postgresql/migrations/02_add_notifications/migration.sql

-- Only include incremental changes
ALTER TABLE "user" ADD COLUMN "notification_preferences" JSONB DEFAULT '{}';

-- Add appropriate indexes
CREATE INDEX "user_notification_preferences_idx" ON "user" USING GIN ("notification_preferences");

-- Use proper SQL syntax for each database type
-- PostgreSQL: TIMESTAMPTZ(6), UUID, JSONB
-- MySQL: TIMESTAMP(0), VARCHAR(36), JSON
```

```bash
# ✅ CORRECT: Database Workflow Commands

# Test migration in development
npm run build-db && npm run check-db

# Create migration files for both databases
mkdir -p db/postgresql/migrations/02_new_feature
mkdir -p db/mysql/migrations/02_new_feature

# Always test complete build process
npm run build
```

---

## 📋 **Implementation Workflow**

### **1. Analysis Phase**
- Understand existing patterns in similar components
- Identify correct `react-basics` components to use
- Plan proper error handling and validation
- **Assess database changes needed** (if any)
- **Plan migration strategy** for schema changes

### **2. Implementation Phase**
- Follow established file structure
- Use proper imports and exports
- Implement security checks first
- Add proper logging throughout
- **Create database migrations first** (if schema changes needed)
- **Test migrations in development** before coding features

### **3. Quality Assurance Phase**
- Run `npm run lint` and fix ALL issues
- Test in both light and dark modes
- Verify responsive behavior
- Check accessibility
- **Verify database migrations work correctly**
- **Test complete build process** (`npm run build`)

### **4. Final Review**
- Ensure zero linting errors
- Verify build success
- Test user flows
- Document any new patterns
- **Confirm migration files exist for both PostgreSQL and MySQL**
- **Verify production deployment readiness**

---

## 🎯 **Success Metrics**

A successful implementation should have:
- ✅ **Zero ESLint errors**
- ✅ **Zero TypeScript errors**
- ✅ **Successful build**
- ✅ **Consistent with platform design**
- ✅ **Proper error handling**
- ✅ **Security implemented**
- ✅ **Usage tracking in place**
- ✅ **Responsive and accessible**

---

## 🧪 **Test Script Standards**

### **Test File Location**
All test scripts belong in: `testing-scripts/api-tests/[category]/`

**Categories:**
- `core-tracking/` - Event tracking APIs
- `analytics/` - Analytics & reporting 
- `data-export/` - Export functionality
- `website-management/` - CRUD & cleanup
- `authentication/` - Security tests
- `v1-api/` - Legacy API endpoints

### **Test Script Template**
```javascript
const API_KEY = 'sly_your_api_key_here';
const BASE_URL = 'http://localhost:3000';

async function testFunctionality() {
  console.log('🔍 Testing [Feature Name]...');
  
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/endpoint`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      console.log('✅ PASS: Test Name');
    } else {
      console.log('❌ FAIL: Test Name');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('🎉 Test complete!');
}

testFunctionality().catch(console.error);
```

### **Test Principles**
- **Use real API calls** - No mocking, test actual endpoints
- **Console output allowed** - Testing scripts exempt from no-console rule
- **Clear pass/fail indicators** - Use ✅/❌ emojis for visibility
- **Descriptive names** - File names should explain what's being tested
- **Error handling** - Always wrap tests in try/catch blocks
- **Cleanup** - Remove test data when possible