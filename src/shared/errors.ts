// Stable machine-readable error codes. The mobile app keys its messages
// off `code`, so never rename one without updating Flutter too.
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PHONE_ALREADY_REGISTERED'
  | 'USERNAME_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'CART_RESTAURANT_MISMATCH'
  | 'ITEM_UNAVAILABLE'
  | 'QUOTE_EXPIRED'
  | 'ADDRESS_NOT_SERVICEABLE'
  | 'MINIMUM_ORDER_NOT_MET'
  | 'PAYMENT_METHOD_UNAVAILABLE'
  | 'MOCK_PAYMENT_DISABLED'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'RATE_LIMITED';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, string>;

  constructor(status: number, code: ErrorCode, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(code: ErrorCode, message: string, details?: Record<string, string>): ApiError {
  return new ApiError(400, code, message, details);
}

export function unauthorized(code: ErrorCode, message: string): ApiError {
  return new ApiError(401, code, message);
}

export function forbidden(message = 'You cannot access this resource.'): ApiError {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'Not found.'): ApiError {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function conflict(code: ErrorCode, message: string): ApiError {
  return new ApiError(409, code, message);
}
