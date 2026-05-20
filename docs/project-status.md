# Project Status

## Current Phase

Phase 0: Specs and technical definition.

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

## Pending Before Coding

- Confirm whether to copy the sticker PDF into the repository as a design reference.
- Define exact QR placement inside the 10 cm sticker.
- Define whether the PDF needs bleed/cut marks.
- Define initial admin-created `DeviceType` fields in the UI.
- Decide whether analytics raw event retention starts at 12 months.

## Next Recommended Work

1. Finalize docs review.
2. Initialize monorepo.
3. Add Next.js app.
4. Add NestJS app.
5. Add PostgreSQL and Prisma.
6. Implement auth.
7. Implement admin-managed device types.
8. Implement device creation.

