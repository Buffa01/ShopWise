import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException
} from "@nestjs/common";
import type { ApiErrorCode, ApiErrorResponse } from "./api-error";

function payload(code: ApiErrorCode, message: string, details?: unknown): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details
    }
  };
}

export function badRequest(code: ApiErrorCode, message: string, details?: unknown) {
  return new BadRequestException(payload(code, message, details));
}

export function conflict(code: ApiErrorCode, message: string, details?: unknown) {
  return new ConflictException(payload(code, message, details));
}

export function unauthorized(code: ApiErrorCode, message: string, details?: unknown) {
  return new UnauthorizedException(payload(code, message, details));
}

export function forbidden(code: ApiErrorCode, message: string, details?: unknown) {
  return new ForbiddenException(payload(code, message, details));
}

