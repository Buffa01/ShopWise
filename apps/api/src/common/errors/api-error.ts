export type ApiErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_ALREADY_EXISTS"
  | "AUTH_MISSING_TOKEN"
  | "AUTH_INVALID_TOKEN"
  | "AUTH_FORBIDDEN"
  | "DEVICE_TYPE_SLUG_EXISTS"
  | "DEVICE_TYPE_NOT_FOUND"
  | "PRINT_ASSET_NOT_FOUND"
  | "VALIDATION_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode | string;
    message: string;
    details?: unknown;
  };
}
