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

---

## 📋 **Implementation Workflow**

### **1. Analysis Phase**
- Understand existing patterns in similar components
- Identify correct `react-basics` components to use
- Plan proper error handling and validation

### **2. Implementation Phase**
- Follow established file structure
- Use proper imports and exports
- Implement security checks first
- Add proper logging throughout

### **3. Quality Assurance Phase**
- Run `npm run lint` and fix ALL issues
- Test in both light and dark modes
- Verify responsive behavior
- Check accessibility

### **4. Final Review**
- Ensure zero linting errors
- Verify build success
- Test user flows
- Document any new patterns

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