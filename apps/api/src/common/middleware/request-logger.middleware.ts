import type { NextFunction, Request, Response } from "express";
import { structuredLogger } from "../logging/structured-logger";

export function requestLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  const startedAt = Date.now();

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const statusCode = response.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    structuredLogger[level]({
      event: "http_request",
      method: request.method,
      path: request.path,
      statusCode,
      durationMs,
      ip: request.ip,
      userAgent: request.get("user-agent") ?? null
    });
  });

  next();
}
