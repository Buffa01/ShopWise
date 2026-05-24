# Costs and Deploy

## Initial Deploy Decision

Recommended initial setup:

```text
Web:      Vercel
API:      Fly.io
Database: Supabase Postgres
Storage:  Fly volume for the first private deploy, Cloudflare R2 before real production operations
```

See the executable deploy guide in [`docs/deploy.md`](../deploy.md).

## Domains

Buy when ready:

```text
shopwise.uy
sw.uy
```

Recommended usage:

```text
shopwise.uy -> public site, login, admin, client app
sw.uy       -> short QR/NFC redirect domain only
```

Examples:

```text
https://shopwise.uy/login
https://shopwise.uy/admin/devices
https://sw.uy/r/A000001
https://sw.uy/n/A000001
```

Future Argentina expansion does not require an architecture change. The same backend can support Argentina. If the business expands there, buy `shopwise.com.ar` or add regional marketing domains later.

## Monthly Cost Estimate

Approximate initial monthly cost:

```text
Vercel Pro:        ~20 USD/month
Supabase Pro:      ~25 USD/month
Fly.io API:        ~6-12 USD/month initially
Cloudflare R2:     ~0-2 USD/month initially
Total:             ~50-60 USD/month initially
```

This assumes low/medium MVP traffic, one production database, one small API instance, and small asset storage.

## Why This Is Cost-Efficient

- Redirect requests are cheap.
- QR/NFC URLs are short and handled by one API endpoint family.
- Sticker PDFs are generated during device creation, not on every scan.
- R2 has low storage cost and no egress fees.
- Analytics counters are cheap if aggregated correctly.

## What Makes Cost Increase

Costs will increase mainly through:

- More database compute.
- Very high analytics event write volume.
- Heavy PDF generation batches.
- Large asset storage.
- Expensive observability/log retention.
- More API instances for high availability.
- More team seats in managed platforms.

## Storage Decision

Use Cloudflare R2 for production assets:

- QR images.
- Sticker PDFs.
- Future template assets.

Use local filesystem storage in development behind the same storage interface.

The initial Fly config mounts a small volume at `/data/storage` so the current filesystem storage implementation can run in a private MVP deploy. This should be treated as temporary. Move to R2 before scaling to multiple API machines or operating with real customer assets.

## API Deploy Configuration

The repository includes:

```text
Dockerfile
fly.toml
.dockerignore
```

Fly applies Prisma migrations during deploy through:

```text
pnpm --filter @shopwise/api prisma:deploy
```

The API health check is:

```text
GET /v1/health
```

## Web Deploy Configuration

Deploy `apps/web` to Vercel and set:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.shopwise.uy/v1
```

## Cost Control Rules

- Generate PDFs once and store them.
- Do not regenerate stickers on every download.
- Keep raw event retention finite.
- Store aggregated analytics for long-term reporting.
- Avoid logging full request bodies or sensitive metadata.
- Add caching for public static assets.

## Security and Rate Limit Environment

Initial production controls:

```text
RATE_LIMIT_REDIRECT_WINDOW_MS=60000
RATE_LIMIT_REDIRECT_MAX=120
RATE_LIMIT_AUTH_WINDOW_MS=60000
RATE_LIMIT_AUTH_MAX=20
```

The v1 limiter is in-memory and protects one API instance. Move the same policy to Redis or provider edge rate limiting before running multiple API instances.

Logs are structured JSON written to stdout/stderr so Fly.io or a future log drain can ingest them without app changes. Request bodies and sensitive values must not be logged.
