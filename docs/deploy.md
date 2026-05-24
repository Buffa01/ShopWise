# Deploy

Initial production target:

```text
Web:      Vercel
API:      Fly.io
Database: Supabase Postgres
Storage:  Local filesystem for development, Cloudflare R2 for production assets
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
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
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
  IP_HASH_SALT="replace-with-random-salt" \
  R2_ACCESS_KEY_ID="replace-with-r2-access-key-id" \
  R2_SECRET_ACCESS_KEY="replace-with-r2-secret-access-key"
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

The API supports two storage drivers:

```text
STORAGE_DRIVER=local
STORAGE_DRIVER=r2
```

Use local filesystem storage for development and short-lived private environments. Use Cloudflare R2 for production assets.

Production R2 configuration:

```text
STORAGE_DRIVER=r2
R2_BUCKET=shopwise-assets-production
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<secret>
R2_SECRET_ACCESS_KEY=<secret>
```

Storage limits are enforced by the API before writing objects:

```text
STORAGE_TOTAL_LIMIT_BYTES=9000000000
STORAGE_MAX_OBJECT_BYTES=52428800
```

The default total limit is 9 GB and the default per-object limit is 50 MB. This is an application-level guard for ShopWise uploads; direct uploads made outside the app can still increase bucket usage.

No R2 public development URL or custom domain is required for private production storage. The API reads from R2 and serves authenticated downloads.

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
