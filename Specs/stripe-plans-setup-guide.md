# Superlytics Stripe Plans Setup Guide

This guide provides exact steps to create all Superlytics plans in Stripe with proper recurring intervals and pricing.

## Overview

We need to create **6 plans total**:
- **3 Subscription Plans**: Hobby, Pro, Enterprise (with monthly/yearly recurring prices)
- **3 Lifetime Plans**: Starter, Pro, Max (with one-time payment prices)

## Method 1: Using Stripe Dashboard (Recommended)

### 1. Hobby Plan ($9/month, $90/year)

**Create Product:**
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **+ Create product**
3. **Name**: `Superlytics Hobby`
4. **Description**: `Perfect for personal projects and small websites. 100k events/month, 5 websites, 3 team members.`
5. **Pricing model**: Standard pricing
6. Select **Recurring**
7. **Amount**: `9.00` USD
8. **Billing period**: Monthly
9. Click **Add product**

**Add Yearly Price:**
1. Find the "Superlytics Hobby" product
2. Click **+ Add another price**
3. **Pricing model**: Standard pricing  
4. Select **Recurring**
5. **Amount**: `90.00` USD
6. **Billing period**: Yearly
7. Click **Add price**

### 2. Pro Plan ($19/month, $190/year)

**Create Product:**
1. Click **+ Create product**
2. **Name**: `Superlytics Pro`
3. **Description**: `For growing businesses. 1M events/month, 25 websites, 10 team members, advanced features.`
4. **Pricing model**: Standard pricing
5. Select **Recurring**
6. **Amount**: `19.00` USD
7. **Billing period**: Monthly
8. Click **Add product**

**Add Yearly Price:**
1. Find the "Superlytics Pro" product
2. Click **+ Add another price**
3. **Pricing model**: Standard pricing
4. Select **Recurring** 
5. **Amount**: `190.00` USD
6. **Billing period**: Yearly
7. Click **Add price**

### 3. Enterprise Plan (Custom Pricing)

**Create Product:**
1. Click **+ Create product**
2. **Name**: `Superlytics Enterprise`
3. **Description**: `For large organizations. Unlimited events, websites, and team members. White-label, custom domain, priority support.`
4. **Skip pricing** (Enterprise is custom/contact sales)
5. Click **Add product**

### 4. Lifetime Starter Plan ($89 one-time)

**Create Product:**
1. Click **+ Create product**
2. **Name**: `Superlytics Starter Lifetime`
3. **Description**: `Lifetime access with starter features. 250k events/month, 10 websites, 5 team members.`
4. **Pricing model**: Standard pricing
5. Select **One time**
6. **Amount**: `89.00` USD
7. Click **Add product**

### 5. Lifetime Pro Plan ($179 one-time)

**Create Product:**
1. Click **+ Create product**
2. **Name**: `Superlytics Pro Lifetime`
3. **Description**: `Lifetime access with pro features. 2M events/month, 50 websites, 25 team members.`
4. **Pricing model**: Standard pricing
5. Select **One time**
6. **Amount**: `179.00` USD
7. Click **Add product**

### 6. Lifetime Max Plan ($299 one-time)

**Create Product:**
1. Click **+ Create product**
2. **Name**: `Superlytics Max Lifetime`
3. **Description**: `Lifetime access with all features. 5M events/month, 100 websites, 50 team members.`
4. **Pricing model**: Standard pricing
5. Select **One time**
6. **Amount**: `299.00` USD
7. Click **Add product**

## Method 2: Using Stripe API (Advanced)

If you prefer using the API, here are the exact curl commands:

### Create Products

```bash
# Hobby Product
curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Superlytics Hobby" \
  -d description="Perfect for personal projects and small websites. 100k events/month, 5 websites, 3 team members."

# Pro Product  
curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Superlytics Pro" \
  -d description="For growing businesses. 1M events/month, 25 websites, 10 team members, advanced features."

# Enterprise Product
curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Superlytics Enterprise" \
  -d description="For large organizations. Unlimited events, websites, and team members."

# Lifetime Products
curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Superlytics Starter Lifetime" \
  -d description="Lifetime access with starter features. 250k events/month, 10 websites, 5 team members."

curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Superlytics Pro Lifetime" \
  -d description="Lifetime access with pro features. 2M events/month, 50 websites, 25 team members."

curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Superlytics Max Lifetime" \
  -d description="Lifetime access with all features. 5M events/month, 100 websites, 50 team members."
```

### Create Recurring Prices

Replace `PRODUCT_ID` with the actual product IDs from above:

```bash
# Hobby Monthly ($9)
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="HOBBY_PRODUCT_ID" \
  -d unit_amount=900 \
  -d currency=usd \
  -d "recurring[interval]"=month \
  -d nickname="Hobby Monthly"

# Hobby Yearly ($90)  
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="HOBBY_PRODUCT_ID" \
  -d unit_amount=9000 \
  -d currency=usd \
  -d "recurring[interval]"=year \
  -d nickname="Hobby Yearly"

# Pro Monthly ($19)
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="PRO_PRODUCT_ID" \
  -d unit_amount=1900 \
  -d currency=usd \
  -d "recurring[interval]"=month \
  -d nickname="Pro Monthly"

# Pro Yearly ($190)
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="PRO_PRODUCT_ID" \
  -d unit_amount=19000 \
  -d currency=usd \
  -d "recurring[interval]"=year \
  -d nickname="Pro Yearly"
```

### Create One-time Prices

```bash
# Starter Lifetime ($89)
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="STARTER_LIFETIME_PRODUCT_ID" \
  -d unit_amount=8900 \
  -d currency=usd \
  -d nickname="Starter Lifetime"

# Pro Lifetime ($179)  
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="PRO_LIFETIME_PRODUCT_ID" \
  -d unit_amount=17900 \
  -d currency=usd \
  -d nickname="Pro Lifetime"

# Max Lifetime ($299)
curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="MAX_LIFETIME_PRODUCT_ID" \
  -d unit_amount=29900 \
  -d currency=usd \
  -d nickname="Max Lifetime"
```

## Method 3: Using the Setup Script

Run the provided setup script:

```bash
# Make sure your .env has valid Stripe keys
node scripts/setup-stripe-plans.js
```

## After Creating Plans

### 1. Copy Price IDs

After creating the plans, copy the price IDs from Stripe Dashboard and update `src/lib/config/simplified-plans.ts`:

```typescript
export const SIMPLIFIED_PLANS: Record<string, PlanConfiguration> = {
  hobby: {
    // ... existing config
    stripeIds: {
      monthly: 'price_1234567890abcdef', // Replace with actual ID
      yearly: 'price_0987654321fedcba',  // Replace with actual ID
    },
  },
  pro: {
    // ... existing config  
    stripeIds: {
      monthly: 'price_abcdef1234567890', // Replace with actual ID
      yearly: 'price_fedcba0987654321',  // Replace with actual ID
    },
  },
  lifetime_starter: {
    // ... existing config
    stripeIds: {
      lifetime: 'price_starter_lifetime', // Replace with actual ID
    },
  },
  lifetime_pro: {
    // ... existing config
    stripeIds: {
      lifetime: 'price_pro_lifetime', // Replace with actual ID  
    },
  },
  lifetime_max: {
    // ... existing config
    stripeIds: {
      lifetime: 'price_max_lifetime', // Replace with actual ID
    },
  },
};
```

### 2. Test the Integration

After updating the price IDs:

1. **Test Checkout**: Try creating a checkout session for each plan
2. **Test Webhooks**: Ensure webhook handling works for all plan types
3. **Test Customer Portal**: Verify customers can manage subscriptions
4. **Test Plan Limits**: Confirm usage tracking works for each plan

### 3. Webhook Configuration

Make sure your webhook endpoint (`/api/webhook/stripe`) is configured in Stripe Dashboard to receive these events:

- `checkout.session.completed`
- `customer.subscription.updated`  
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## Verification Checklist

- [ ] All 6 products created in Stripe
- [ ] Hobby plan has monthly ($9) and yearly ($90) recurring prices
- [ ] Pro plan has monthly ($19) and yearly ($190) recurring prices  
- [ ] Enterprise plan created (no prices needed)
- [ ] 3 lifetime plans have one-time prices ($89, $179, $299)
- [ ] Price IDs updated in `simplified-plans.ts`
- [ ] Webhook endpoint configured
- [ ] Test transactions work for each plan type

## Troubleshooting

**"Invalid API Key" Error**: 
- Check that `STRIPE_SECRET_KEY` in `.env` starts with `sk_test_` or `sk_live_`
- Ensure no extra spaces or quotes around the key

**"Price already exists" Error**:
- Each price needs a unique combination of product + amount + interval
- Check if prices already exist in Stripe Dashboard

**Webhook Issues**:
- Verify webhook URL is publicly accessible
- Check that `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret in Stripe Dashboard

## Next Steps

Once all plans are created and configured:

1. **Test the complete signup flow**: Registration → Plan selection → Payment → Webhook activation
2. **Test plan upgrades/downgrades**: Using the customer portal
3. **Test usage tracking**: Ensure limits are enforced correctly
4. **Test AppSumo codes**: For lifetime plan redemption (when implemented)

The Stripe SaaS integration will be fully functional once these plans are properly set up!