# Deploy

Initial production target:

```text
Web:      Vercel
API:      Fly.io
Database: Supabase Postgres
Storage:  Fly volume for the first deploy, Cloudflare R2 before real production operations
```

The repository includes deploy configuration for the API. The web app should be deployed from Vercel using `apps/web` as the project root.

## Required Secrets

API secrets:

```text
DATABASE_URL
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_NAME
IP_HASH_SALT
```

Web environment:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.shopwise.uy/v1
```

## API on Fly.io

Create the Fly app:

```bash
fly apps create shopwise-api
```

Create a persistent volume for generated local assets:

```bash
fly volumes create shopwise_storage --region mia --size 1
```

Set secrets:

```bash
fly secrets set \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="replace-with-strong-secret" \
  ADMIN_EMAIL="admin@shopwise.uy" \
  ADMIN_PASSWORD="replace-with-strong-password" \
  ADMIN_NAME="ShopWise Admin" \
  IP_HASH_SALT="replace-with-random-salt"
```

Deploy:

```bash
fly deploy
```

Verify:

```bash
fly status
curl https://shopwise-api.fly.dev/v1/health
```

Run seed once after the first deploy if needed:

```bash
fly ssh console -C "pnpm --filter @shopwise/api prisma:seed"
```

## Web on Vercel

Create a Vercel project with:

```text
Root directory: apps/web
Framework: Next.js
Build command: pnpm build
Install command: pnpm install --frozen-lockfile
Output: Next.js default
```

Set:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.shopwise.uy/v1
```

If deploying from the monorepo root instead, configure Vercel to use the root package manager and the `apps/web` project root.

## Domains

Recommended DNS:

```text
shopwise.uy      -> Vercel web
api.shopwise.uy  -> Fly API
sw.uy            -> Fly API short redirect domain
```

The API must receive both:

```text
https://api.shopwise.uy/v1/health
https://sw.uy/r/A000001
```

Configure `SHORT_LINK_BASE_URL=https://sw.uy` in Fly so generated QR/NFC URLs use the short domain.

## Database

Use Supabase Postgres initially. Fly runs `pnpm --filter @shopwise/api prisma:deploy` as a release command, so committed Prisma migrations are applied during deploy.

Production database rules:

- Require SSL if the provider requires it.
- Never use local `.env` credentials in Fly secrets.
- Run integration tests locally before deploy.
- Backup Supabase before destructive migrations.

## Storage

This deploy config uses a Fly volume at `/data/storage` because the current storage implementation is filesystem-based.

This is acceptable for an initial private MVP, but Cloudflare R2 should replace local production storage before real customer operations because:

- Fly volumes are attached to one region/machine.
- Scaling multiple API machines with local asset storage is unsafe.
- R2 is cheaper and better for long-term printable assets.

## Pre-Deploy Checklist

Run locally:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
docker build -t shopwise-api .
```

Then verify:

```bash
curl https://api.shopwise.uy/v1/health
curl -I https://sw.uy/r/INVALID
```
