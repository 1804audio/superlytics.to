# Plan Changes Guide

Quick reference for updating plan names, pricing, and features in SuperLytics.

## 🎯 Core Configuration (Always Required)

### 1. Plan Configuration
**File:** `/src/lib/config/simplified-plans.ts`
- Update plan `id`, `name`, `prices`, `limits`, `features`
- Modify both subscription and lifetime plans

### 2. Environment Variables
**Files:** `.env`, `.env.example`
- Update Stripe price IDs: `STRIPE_PRICE_[PLAN]_MONTHLY/YEARLY`
- Add new environment variables for new plans

### 3. Server Price Mapping
**File:** `/src/lib/server/plan-price-ids.ts`
- Update price ID mappings
- Update validation array with new environment variable names

## 🧪 Testing (Always Required)

### 4. Test Files
**Files:** `/src/lib/__tests__/*.test.ts`
- Update plan references in test descriptions
- Update assertions with new pricing/limits
- Update mock environment variables

## 🎨 Frontend (If Changing Names)

### 5. UI Components
**Files:** `/src/app/(main)/billing/*.tsx`
- Update plan ID checks in `getPlanBadgeClass()` functions
- Update any hardcoded plan references

### 6. CSS Classes
**Files:** `/src/app/(main)/billing/*.module.css`
- Rename CSS classes if plan names change
- Update component references to new class names

### 7. User-Facing Text
**Files:** `/src/app/(main)/profile/data/DataContent.tsx`, `/src/lib/middleware/api-middleware.ts`
- Update feature restriction messages
- Update upgrade prompts and error messages

## 💳 Stripe Integration

### 8. Stripe Products
- **Manual Task:** Update product names in Stripe Dashboard
- **Script:** Use `/scripts/fix-stripe-recurring-prices.js` if needed

## ✅ Verification Checklist

```bash
# 1. Lint check
npm run lint

# 2. Test all plan functionality
npm run test -- --testPathPatterns="plan"

# 3. Search for old references
grep -r "old_plan_name" src/

# 4. Build verification
npm run build
```

## 🚨 Common Gotchas

- **Database Default:** Check `prisma/schema.prisma` for default plan values
- **CSS Classes:** Don't forget to update both CSS files AND component references
- **Environment Variables:** Update both example and actual env files
- **Lifetime Plans:** Update environment variables for lifetime plan price IDs

## 📋 Quick Change Template

For plan name changes:
1. `simplified-plans.ts` → Update plan object
2. `plan-price-ids.ts` → Update price mappings
3. `.env*` → Update Stripe price IDs
4. `*.test.ts` → Update test references
5. `*Card.tsx` → Update plan ID checks
6. `*.module.css` → Rename CSS classes
7. Run verification checklist

**Time Estimate:** 15-30 minutes for complete plan change