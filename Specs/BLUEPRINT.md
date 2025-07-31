# SuperLytics Platform Blueprint

**The Ultimate Developer Guide for One-Shot Feature Implementation & Debugging**

---

## 🎯 **Platform Overview**

**SuperLytics** is a SaaS analytics platform that provides website tracking, analytics, and insights with plan-based feature access.

### **Core Purpose**
- **Website Analytics**: Track pageviews, events, users, sessions
- **Real-time Insights**: Live stats, custom events, user behavior
- **API Access**: Programmatic data access via secure API keys
- **Multi-tenancy**: Individual users + team-based website management

---

## 🏗️ **System Architecture**

### **Tech Stack**
- **Frontend**: Next.js 15 + React + TypeScript
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL + ClickHouse (high-performance analytics)
- **UI**: react-basics component library
- **Auth**: Session-based + API key authentication
- **Payments**: Stripe integration

### **Key Directories**
```
src/
├── app/
│   ├── (main)/              # Authenticated dashboard pages
│   ├── api/                 # API endpoints
│   └── login/               # Public auth pages
├── components/              # Reusable UI components
├── lib/                     # Core utilities & services
├── queries/                 # Database query functions
testing-scripts/             # API test suite
db/                         # Database schemas & migrations
```

---

## 🔑 **Authentication System**

### **Dual Authentication**
1. **Session Auth**: Web interface login (email/username + password)
2. **API Key Auth**: Programmatic access with Bearer/x-api-key headers

### **Authentication Priority**
```typescript
// API keys take priority over session auth
1. Check for API key in headers (Bearer or x-api-key)
2. Validate API key → return user with permissions
3. Fallback to session-based authentication
4. Return unauthorized if both fail
```

### **API Key System**
- **Format**: `sly_` prefix + 40-char secure random string
- **Storage**: AES-256-GCM encrypted in database
- **Permissions**: Granular read/write access control
- **Usage**: Tracked with last-used timestamps

---

## 📊 **Database Architecture**

### **Core Models**
- **User**: Authentication, plans, billing
- **Website**: Tracked websites with domain info
- **WebsiteEvent**: Individual page views/events
- **EventData**: Custom event properties
- **Session**: User sessions with device info
- **SessionData**: Session-level custom data
- **ApiKey**: Encrypted API keys with permissions

### **Migration System**
```bash
# Database changes workflow
1. Edit db/{database}/schema.prisma (source of truth)
2. Create migration: db/{database}/migrations/XX_name/migration.sql
3. Run: npm run build-db (copies & generates client)
4. Test: npm run check-db (applies migrations)
```

### **Data Cleanup**
Website deletion triggers 6-step cleanup:
1. EventData deletion
2. SessionData deletion  
3. WebsiteEvent deletion
4. Session deletion
5. Report deletion
6. Website deletion/soft-delete

---

## 🎨 **Frontend Standards**

### **Component Structure**
```typescript
'use client';
import { useState } from 'react';
import { Button, Form, FormRow, FormInput } from 'react-basics';
import { useMessages } from '@/components/hooks';
import styles from './Component.module.css';

export default function Component() {
  const { formatMessage, labels } = useMessages();
  const [loading, setLoading] = useState(false);
  
  return (
    <div className={styles.container}>
      <Button variant="primary">{labels.submit}</Button>
    </div>
  );
}
```

### **UI Rules**
- **ALWAYS** use react-basics components (Button, Form, FormRow, FormInput)
- **NEVER** create custom components when platform ones exist
- **USE** CSS variables for colors: `var(--font-color300)`
- **FOLLOW** existing layout patterns exactly

---

## 🔗 **API Development**

### **API Route Pattern**
```typescript
import { parseRequest } from '@/lib/request';
import { json, unauthorized, badRequest } from '@/lib/response';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  // validation schema
});

export async function POST(request: Request) {
  const { auth, body, error } = await parseRequest(request, schema);
  
  if (error) return error();
  if (!auth?.user) return unauthorized();
  
  // Business logic here
  
  return json({ success: true, data: result });
}
```

### **Authentication Check**
```typescript
// API routes automatically get auth via parseRequest
const { auth, body, error } = await parseRequest(request, schema);

// API key auth provides:
auth.user        // User object
auth.apiKey      // true if authenticated via API key
auth.permissions // ['read', 'write'] for API keys
```

---

## 💳 **Plan & Feature System**

### **Plan Structure**
```typescript
const SIMPLIFIED_PLANS = {
  free: { websites: 1, events: 10000, apiKeys: 0 },
  starter: { websites: 5, events: 100000, apiKeys: 1 },
  growth: { websites: 25, events: 1000000, apiKeys: 5 },
  enterprise: { websites: -1, events: -1, apiKeys: -1 } // unlimited
};
```

### **Feature Gating**
```typescript
// Check if user has feature access
const hasFeature = await simpleUsageManager.hasFeature(userId, 'apiKeys');
if (!hasFeature) return forbidden('Feature not available in your plan');

// Check usage limits
const userPlan = SIMPLIFIED_PLANS[auth.user.planId || 'free'];
const limit = userPlan?.limits?.apiKeys || 0;
if (limit !== -1 && currentUsage >= limit) {
  return forbidden(`Limit reached for ${userPlan.name} plan`);
}
```

---

## 📈 **Analytics & Tracking**

### **Event Tracking Flow**
```javascript
// Client-side (script.js)
superlytics.track('event_name', { custom: 'data' });

// Server receives at /api/send
POST /api/send
{
  "type": "event",
  "payload": {
    "website": "website-id",
    "url": "/page",
    "name": "event_name",
    "data": { "custom": "data" }
  }
}

// Stored as WebsiteEvent + EventData records
```

### **Analytics Endpoints**
- `GET /api/websites/{id}/stats` - Core metrics
- `GET /api/websites/{id}/pageviews` - Page view data
- `GET /api/websites/{id}/events` - Custom events
- `GET /api/websites/{id}/sessions` - Session data

---

## 🧪 **Testing Strategy**

### **Test Categories**
```
testing-scripts/api-tests/
├── core-tracking/        # Event tracking APIs
├── analytics/           # Analytics endpoints
├── data-export/         # Export functionality
├── website-management/  # CRUD operations
├── authentication/      # Security tests
└── v1-api/             # Legacy endpoints
```

### **Test Pattern**
```javascript
const API_KEY = 'sly_your_key_here';

async function testFeature() {
  console.log('🔍 Testing Feature...');
  
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(testData)
  });
  
  console.log(response.ok ? '✅ PASS' : '❌ FAIL');
}
```

---

## 🚨 **Debugging Playbook**

### **Common Issues & Solutions**

**API Key Not Working**
1. Check headers: `Bearer token` or `x-api-key: token`
2. Verify key format: starts with `sly_`
3. Check permissions: user has required plan features
4. Test auth: `checkAuth()` in `/src/lib/auth.ts`

**Database Errors**
1. Check migration status: `npm run check-db`
2. Verify schema sync between db/ and prisma/
3. Look for foreign key violations
4. Check cascade delete settings

**500 Errors**
1. Check server logs for detailed error
2. Verify request validation schema
3. Check authentication requirements
4. Test with curl/Postman first

**UI Not Updating**
1. Verify react-basics component usage
2. Check CSS variable usage
3. Ensure proper state management
4. Test in both light/dark modes

### **Debug Commands**
```bash
# Check database status
npm run check-db

# Run linting
npm run lint

# Test API endpoints
cd testing-scripts/api-tests && node test-complete-api-suite.js

# Check build
npm run build
```

---

## ⚡ **Development Workflow**

### **Feature Implementation**
1. **Plan**: Understand requirements & existing patterns
2. **Database**: Create migrations if schema changes needed
3. **API**: Build endpoints following established patterns
4. **Frontend**: Use react-basics components & CSS variables
5. **Test**: Create test script in appropriate category
6. **Validate**: Run linting, tests, and build checks

### **Debugging Process**
1. **Reproduce**: Create minimal test case
2. **Isolate**: Test individual components/endpoints
3. **Trace**: Follow request flow through auth → validation → business logic
4. **Fix**: Apply fix following platform patterns
5. **Verify**: Test fix with comprehensive test suite

---

## 🛡️ **Security & Performance**

### **Security Rules**
- **NEVER** expose API keys in client code
- **ALWAYS** validate inputs with Zod schemas
- **ENCRYPT** sensitive data (API keys use AES-256-GCM)
- **SANITIZE** database queries (Prisma prevents SQL injection)
- **TRACK** all API usage for monitoring

### **Performance Guidelines**
- **INDEX** database queries properly
- **BATCH** operations when possible
- **CACHE** frequently accessed data
- **PAGINATE** large result sets
- **OPTIMIZE** bundle size with tree shaking

---

## 📋 **Quick Reference**

### **Essential Files**
- `src/lib/auth.ts` - Authentication logic
- `src/lib/services/api-key-service.ts` - API key management
- `src/queries/prisma/` - Database queries
- `src/lib/response.ts` - Standardized API responses
- `CLAUDE.md` - Coding standards & patterns

### **Key Commands**
```bash
npm run dev          # Start development server
npm run build        # Full build with DB setup
npm run lint         # Check code quality
npm run check-db     # Apply database migrations
```

### **Testing**
```bash
cd testing-scripts/api-tests
node test-complete-api-suite.js  # Run all tests
```

---

## 🎯 **Success Criteria**

A successful implementation has:
- ✅ Zero ESLint errors
- ✅ Zero TypeScript errors  
- ✅ All tests passing
- ✅ Database migrations working
- ✅ API authentication working
- ✅ UI follows design system
- ✅ Feature gating implemented
- ✅ Usage tracking in place

---

**This blueprint contains everything needed to work effectively on SuperLytics. Follow these patterns and you'll build features that integrate seamlessly with the existing platform.**