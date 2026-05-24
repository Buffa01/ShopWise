import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Request, Response } from "express";
import { structuredLogger } from "../logging/structured-logger";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      this.logException(exception, status, request);

      if (typeof payload === "object" && payload !== null && "error" in payload) {
        response.status(status).json(payload);
        return;
      }

      response.status(status).json({
        error: {
          code: status === HttpStatus.BAD_REQUEST ? "VALIDATION_ERROR" : exception.name,
          message: exception.message
        }
      });
      return;
    }

    this.logException(exception, HttpStatus.INTERNAL_SERVER_ERROR, request);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error"
      }
    });
  }

  private logException(exception: unknown, statusCode: number, request: Request) {
    const message = exception instanceof Error ? exception.message : "Unknown exception";
    const stack = exception instanceof Error ? exception.stack : undefined;
    const level = statusCode >= 500 ? "error" : "warn";

    structuredLogger[level]({
      event: "http_exception",
      method: request.method,
      path: request.path,
      statusCode,
      message,
      stack: statusCode >= 500 ? stack : undefined
    });
  }
}
