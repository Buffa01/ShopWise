# Project Status

## Current Phase

Phase 1: Executable foundation.

## Completed

- Defined initial product scope.
- Chose monorepo architecture.
- Chose Next.js web + NestJS API.
- Chose PostgreSQL + Prisma.
- Chose JWT auth owned by API.
- Chose split device status model.
- Chose separate QR/NFC URLs.
- Defined initial short code strategy.
- Defined initial Prisma domain model.
- Defined backend modules.
- Defined frontend routes.
- Defined API v1 draft.
- Defined roadmap and vertical issues.
- Added device types as admin-managed records.
- Documented initial deploy and cost estimate.
- Documented analytics retention strategy.
- Initialized pnpm/Turborepo monorepo.
- Added `apps/web` Next.js app.
- Added `apps/api` NestJS app.
- Added shared packages for contracts, config, utils, and templates.
- Added local PostgreSQL via Docker Compose on port `5433`.
- Added Prisma schema and initial migration.
- Added admin seed and Google Reviews device type seed.
- Verified local web/API startup.
- Implemented JWT auth endpoints.
- Implemented client registration with business creation.
- Implemented role guards and admin-only test endpoint.
- Added minimal login/register/admin/client web routes.
- Implemented admin device type CRUD API.
- Implemented admin device type list/create/edit screens.
- Implemented admin device creation API.
- Implemented batch device creation API.
- Implemented base36 public code allocation with `CodeSequence`.
- Implemented admin device list/detail/create/batch screens.
- Implemented public QR/NFC redirect endpoints.
- Implemented scan/tap/redirect event tracking.
- Added latest events and `lastScanAt` to admin device detail.
- Implemented local storage service for generated assets.
- Implemented QR PNG generation for device `qrUrl`.
- Implemented initial 10 cm sticker PDF generation.
- Added latest sticker PDF download from admin device detail.
- Implemented client device claim endpoint.
- Implemented client-owned device list/detail endpoints.
- Implemented client device alias, target URL, and active/paused/inactive configuration.
- Added client device list, claim, and configuration screens.
- Implemented admin client list/create/detail endpoints and screens.
- Implemented admin device support editing for alias, target URL, production status, and operational status.
- Implemented admin assign/reassign/unassign device workflows.
- Added audit logs and device events for admin device support actions.
- Added admin device filters for search, assignment, production, and operational status.
- Implemented admin metrics overview endpoint and dashboard.
- Implemented client metrics overview endpoint and dashboard.
- Implemented admin/client per-device metrics endpoints and summary cards.
- Added 30-day daily scan buckets, QR/NFC split, redirects, top devices, and top clients.
- Added in-memory rate limiting for public redirect and auth endpoints.
- Added structured JSON request, exception, and rate limit logs.
- Added basic API security headers and proxy-aware client IP handling.

## Confirmed Decisions

```text
Monorepo: Turborepo
Frontend: Next.js
Backend: NestJS
Database: PostgreSQL
ORM: Prisma
Auth: JWT in NestJS
Storage: local dev, Cloudflare R2 prod
Web deploy: Vercel
API deploy: Fly.io
DB provider: Supabase Postgres
Short domain: sw.uy later
Main domain: shopwise.uy later
Sticker: circular, 10 cm diameter
Sticker output: PDF initially
Initial product type: Google Reviews
```

## Design Reference

Current Google Reviews sticker reference:

```text
/Users/nicolasmartinbuffa/Downloads/sticker_google.pdf
```

Observed file details:

```text
Format: PDF 1.7
Pages: 1
Size: ~190 KB
```

The file is a design reference only for now. The implementation should later store production templates inside the repo or object storage instead of depending on the Downloads path.

## Pending Product Decisions

- Define exact QR placement inside the 10 cm sticker.
- Define whether the PDF needs bleed/cut marks.
- Decide whether analytics raw event retention starts at 12 months.

## Next Recommended Work

1. Replace basic sticker template with Figma-based artwork.
2. Run end-to-end browser QA for admin and client screens.
3. Replace temporary Fly volume asset storage with Cloudflare R2.

## Local Verification

Last verified:

```text
pnpm db:migrate
pnpm db:seed
pnpm typecheck
pnpm build
pnpm lint
pnpm test
pnpm dev
curl http://localhost:3001/v1/health
curl -I http://localhost:3000
```

Result:

```text
API health: {"status":"ok","service":"shopwise-api"}
Web: HTTP 200
Auth: admin login, client registration, /auth/me, and admin 403 checks pass
Device types: admin list/create/update passes; client access returns 403
Devices: single creation, batch creation, list, and detail pass
Redirect: unconfigured fallback, active redirect, QR/NFC events, and lastScanAt pass
Assets: QR PNG, sticker PDF, PrintAsset record, and authenticated PDF download pass
Client devices: claim, owned list/detail, alias/target/status configuration pass
Admin support: client list/create/detail, device edit, assign, unassign, audit/event recording pass
Metrics: admin overview, client overview, per-device metrics, QR/NFC split, top devices, top clients pass
Security 10A: redirect/auth rate limits, structured logs, security headers pass
Admin audit logs: admin list/filter screen, device/client shortcuts, and admin-only API pass
Integration tests 11A: auth/roles, device types, device creation, batch creation, claim, client config, QR/NFC redirect, metrics, audit logs, and asset download pass
Deploy config 11B: Dockerfile, Fly API config, Prisma deploy migration command, Vercel/Fly deploy docs, and production env checklist added
```
