import type { NextFunction, Request, Response } from "express";

export function securityHeadersMiddleware(_request: Request, response: Response, next: NextFunction) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  response.setHeader("Permissions-Policy", "camera=(self), geolocation=(), microphone=()");

  next();
}
