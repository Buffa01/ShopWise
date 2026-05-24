import type { NextFunction, Request, Response } from "express";
import { structuredLogger } from "../logging/structured-logger";

interface RateLimitRule {
  name: string;
  match: (request: Request) => boolean;
  windowMs: number;
  max: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

const RULES: RateLimitRule[] = [
  {
    name: "public_redirect",
    match: (request) => request.method === "GET" && /^\/[rn]\/[A-Za-z0-9]+$/.test(request.path),
    windowMs: Number(process.env.RATE_LIMIT_REDIRECT_WINDOW_MS ?? 60_000),
    max: Number(process.env.RATE_LIMIT_REDIRECT_MAX ?? 120)
  },
  {
    name: "auth",
    match: (request) => request.method === "POST" && /^\/v1\/auth\/(login|register)$/.test(request.path),
    windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? 60_000),
    max: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 20)
  }
];

export function rateLimitMiddleware(request: Request, response: Response, next: NextFunction) {
  const rule = RULES.find((candidate) => candidate.match(request));

  if (!rule) {
    next();
    return;
  }

  const now = Date.now();
  const key = `${rule.name}:${request.ip}`;
  const bucket = getBucket(key, rule, now);
  bucket.count += 1;

  const remaining = Math.max(rule.max - bucket.count, 0);
  const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  response.setHeader("X-RateLimit-Limit", String(rule.max));
  response.setHeader("X-RateLimit-Remaining", String(remaining));
  response.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > rule.max) {
    response.setHeader("Retry-After", String(retryAfterSeconds));
    structuredLogger.warn({
      event: "rate_limit_exceeded",
      rule: rule.name,
      path: request.path,
      ip: request.ip,
      retryAfterSeconds
    });
    response.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please retry later.",
        details: {
          retryAfterSeconds
        }
      }
    });
    return;
  }

  cleanupExpiredBuckets(now);
  next();
}

function getBucket(key: string, rule: RateLimitRule, now: number) {
  const current = buckets.get(key);

  if (current && current.resetAt > now) {
    return current;
  }

  const nextBucket = {
    count: 0,
    resetAt: now + rule.windowMs
  };
  buckets.set(key, nextBucket);

  return nextBucket;
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 1000) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
