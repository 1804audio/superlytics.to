// API Response Types for Stripe Integration

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface StripeCheckoutApiResponse extends ApiResponse {
  url?: string;
}

export interface StripePortalApiResponse extends ApiResponse {
  url?: string;
}

export interface StripeWebhookResponse extends ApiResponse {
  received?: boolean;
}

// API Request Types
export interface CreateCheckoutRequest {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  couponId?: string;
}

export interface CreatePortalRequest {
  returnUrl: string;
}

// API Error Types
export interface StripeApiError {
  message: string;
  type?:
    | 'card_error'
    | 'invalid_request_error'
    | 'api_error'
    | 'authentication_error'
    | 'rate_limit_error';
  code?: string;
  param?: string;
}

// Validation Schema Types (for use with Zod)
export interface CreateCheckoutSchema {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  couponId?: string;
}

export interface CreatePortalSchema {
  returnUrl: string;
}
