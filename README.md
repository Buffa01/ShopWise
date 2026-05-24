# ShopWise

ShopWise is a SaaS + hardware platform for physical QR/NFC devices with configurable destinations, analytics, remote support, and printable assets.

The first product is a Google Reviews QR + NFC sticker. Every QR and NFC tag points to a short ShopWise URL, never directly to the customer's final URL.

## Spec-Driven Development

This repository starts with specs before application code. The current documentation is the implementation contract for the first version.

Start here:

- [Product brief](docs/specs/00-product-brief.md)
- [Architecture](docs/specs/01-architecture.md)
- [Domain model](docs/specs/02-domain-model.md)
- [Backend modules](docs/specs/03-backend-modules.md)
- [API contracts](docs/contracts/api-v1.md)
- [Frontend routes](docs/specs/04-frontend-routes.md)
- [Core flows](docs/specs/05-core-flows.md)
- [QR/NFC short links](docs/specs/06-qr-nfc-short-links.md)
- [Sticker generation](docs/specs/07-sticker-generation.md)
- [Roadmap and tasks](docs/roadmap/roadmap.md)
- [Vertical issues](docs/roadmap/vertical-issues.md)
- [Risks and decisions](docs/specs/08-risks-and-open-decisions.md)
- [Acceptance criteria](docs/specs/09-acceptance-criteria.md)
- [Costs and deploy](docs/specs/10-costs-and-deploy.md)
- [Deploy guide](docs/deploy.md)
- [Analytics retention](docs/specs/11-analytics-retention.md)
- [Device types](docs/specs/12-device-types.md)
- [Project status](docs/project-status.md)

## Initial Architecture Decision

Use a monorepo with:

- `apps/web`: Next.js frontend application.
- `apps/api`: NestJS backend API.
- `packages/*`: shared contracts, config, UI, templates, and utilities.

See [ADR-0001](docs/adr/0001-monorepo-nextjs-nestjs.md).

## Local Development

Requirements:

- Node.js 22+
- Docker
- pnpm 9+

If pnpm is not installed globally, commands can be run with:

```bash
npx pnpm@9.15.4 <command>
```

Setup:

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Local URLs:

```text
Web:      http://localhost:3000
API:      http://localhost:3001/v1/health
Postgres: localhost:5433
```

ShopWise uses `5433` locally to avoid conflicts with other local Postgres containers.

## Deploy

Initial deploy targets:

```text
Web:      Vercel
API:      Fly.io
Database: Supabase Postgres
Storage:  Fly volume initially, Cloudflare R2 before real production operations
```

See [Deploy guide](docs/deploy.md).
