# ADR-0001: Monorepo with Next.js Web and NestJS API

## Status

Accepted for initial implementation.

## Context

ShopWise needs a customer/admin web application, a public redirect surface, device lifecycle management, analytics, asset generation, auth, and future product expansion.

Three options were considered:

- Option A: React SPA + NestJS API.
- Option B: Next.js fullstack, NestJS only if needed later.
- Option C: Monorepo with `apps/web` and `apps/api`, using Turborepo or Nx.

## Decision

Use Option C:

- `apps/web`: Next.js frontend.
- `apps/api`: NestJS backend.
- Monorepo orchestration: Turborepo initially, with the option to migrate to Nx only if dependency graph tooling or plugin conventions become necessary.
- Shared packages for contracts, config, UI, templates, and utilities.

## Rationale

Next.js is still valuable as the React frontend because it provides routing, server rendering where useful, optimized builds, and a strong app structure.

NestJS should own the backend domain because ShopWise has backend-heavy requirements:

- Public low-latency redirects.
- Device lifecycle and claim rules.
- Batch creation.
- Analytics ingestion and aggregation.
- Asset generation jobs.
- Role-based access control.
- Audit logs.
- Future integrations and background processing.

A pure Next.js fullstack app would be faster at the start but would blur domain boundaries as the platform grows. A plain React SPA would work, but Next.js gives better routing and production ergonomics with little downside.

## Consequences

- Frontend and backend deploy independently.
- API contracts must be documented and shared.
- Auth must be designed for cross-app use.
- Some duplication risk exists unless shared packages are kept small and intentional.

## Initial Deploy Assumption

- API: containerized NestJS service.
- Web: Vercel, Cloudflare Pages, or containerized Next.js.
- Database: managed PostgreSQL.
- Storage: Cloudflare R2 or S3-compatible storage.
- Short domain: `sw.uy` routed to API redirect endpoints.

