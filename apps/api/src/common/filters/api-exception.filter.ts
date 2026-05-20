import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

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

    console.error(exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error"
      }
    });
  }
}
