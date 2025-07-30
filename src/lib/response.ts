import { serializeError } from 'serialize-error';

// Safe error handling that prevents information disclosure
function sanitizeError(error: any): string {
  // In development, show detailed errors for debugging
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(serializeError(error));
  }

  // In production, only show safe error messages
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Only return the message for known safe error types
    const safeErrorTypes = ['ValidationError', 'BadRequestError', 'UnauthorizedError'];
    if (safeErrorTypes.includes(error.constructor.name)) {
      return error.message;
    }
  }

  // Default safe message for production
  return 'An error occurred';
}

export function ok() {
  return Response.json({ ok: true });
}

export function json(data: any, options?: ConstructorParameters<typeof Response>[1]) {
  return Response.json(data, options);
}

export function badRequest(error: any = 'Bad request') {
  return Response.json({ error: sanitizeError(error) }, { status: 400 });
}

export function unauthorized(error: any = 'Unauthorized') {
  return Response.json({ error: sanitizeError(error) }, { status: 401 });
}

export function forbidden(error: any = 'Forbidden') {
  return Response.json({ error: sanitizeError(error) }, { status: 403 });
}

export function notFound(error: any = 'Not found') {
  return Response.json({ error: sanitizeError(error) }, { status: 404 });
}

export function tooManyRequests(error: any = 'Too many requests') {
  return Response.json({ error: sanitizeError(error) }, { status: 429 });
}

export function serverError(error: any = 'Server error') {
  // Log the actual error for debugging (server-side only)
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error('Server Error:', error instanceof Error ? error.stack : error);
  }

  // Return sanitized error to client
  return Response.json(
    {
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : sanitizeError(error),
    },
    { status: 500 },
  );
}
