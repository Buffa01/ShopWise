# Vertical Issues

These issues are implementation-ready slices. Each issue should produce a working, reviewable increment.

## Foundation

### SWS-001 Initialize Monorepo

Scope:

- Configure package manager.
- Add Turborepo.
- Add base workspace scripts.
- Add lint/format conventions.

Acceptance criteria:

- `web`, `api`, and shared packages can be addressed from root scripts.
- README documents local setup.

### SWS-002 Database and Prisma Baseline

Scope:

- Add PostgreSQL local environment.
- Add Prisma schema.
- Add first migration.
- Add seed script for admin user.

Acceptance criteria:

- Database can be migrated locally.
- Seed creates an admin user.
- Prisma schema includes initial domain enums and models.

## Auth and Access

### SWS-010 Client Registration and Login

Scope:

- Register client user.
- Create business profile.
- Login with JWT.
- Add current-user endpoint.

Acceptance criteria:

- Client can register and login.
- Duplicate email is rejected.
- Password is hashed.
- Auth errors use standard API error shape.

### SWS-011 Roles and Ownership Guards

Scope:

- Admin guard.
- Client guard.
- Device ownership guard.

Acceptance criteria:

- Client cannot access another client's device.
- Admin can access all devices.
- Unauthorized requests are rejected.

## Devices

### SWS-020 Device Code Generation

Scope:

- Add admin-managed device type model.
- Implement base36 sequence generation.
- Generate `publicCode`, `qrPath`, `nfcPath`, `qrUrl`, `nfcUrl`.
- Add unit tests for collision/retry behavior.

Acceptance criteria:

- Generated codes are unique.
- Code generation is deterministic in tests.
- Public codes are distinct from UUIDs.

### SWS-021 Admin Single Device Creation

Scope:

- Add admin endpoint.
- Persist device.
- Return generated URLs.
- Record audit/event.

Acceptance criteria:

- Admin can create one device.
- Non-admin cannot create a device.
- Device starts unassigned and inactive.

### SWS-022 Admin Batch Device Creation

Scope:

- Add batch endpoint.
- Create `DeviceBatch`.
- Generate N devices.
- Track partial failures.

Acceptance criteria:

- Admin can create 100 devices in one request.
- All devices are linked to the batch.
- Unique constraint violations are handled with retry or clear failure.

## Redirect and Analytics

### SWS-030 Public QR Redirect

Scope:

- Implement `GET /r/:code`.
- Record QR event.
- Redirect if active and configured.
- Fallback otherwise.

Acceptance criteria:

- QR scan increments QR metrics.
- Missing target URL does not produce a broken redirect.
- Invalid code returns safe error page.

### SWS-031 Public NFC Redirect

Scope:

- Implement `GET /n/:code`.
- Record NFC event.
- Same resolution rules as QR.

Acceptance criteria:

- NFC tap increments NFC metrics.
- QR and NFC sources are distinguishable in analytics.

### SWS-032 Event Privacy

Scope:

- Hash or truncate IP.
- Store user agent and referrer safely.
- Avoid storing sensitive request data.

Acceptance criteria:

- Events do not store raw IP addresses.
- Event metadata is documented.

## Client Device Management

### SWS-040 Claim Device

Scope:

- Add authenticated claim endpoint.
- Validate device availability.
- Assign to business.
- Record claim event and audit log.

Acceptance criteria:

- Client can claim unassigned device.
- Assigned devices cannot be claimed by another client.
- Disabled or archived devices cannot be claimed.

### SWS-041 Configure Device

Scope:

- Update alias, target URL, and operational status.
- Validate URL.
- Restrict immutable fields.

Acceptance criteria:

- Client can configure own device.
- Client cannot edit `publicCode`, `qrUrl`, or `nfcUrl`.
- Invalid URLs are rejected.

## Assets

### SWS-050 QR Image Generation

Scope:

- Generate QR image from `qrUrl`.
- Store image in object storage.
- Save storage key.

Acceptance criteria:

- QR is generated for every created device.
- QR points to ShopWise internal QR URL.

### SWS-051 Sticker Asset Generation

Scope:

- Add v1 sticker template.
- Insert QR image.
- Export PNG/PDF.
- Store assets and metadata.

Acceptance criteria:

- Asset is print-ready at configured dimensions/DPI.
- Asset generation failure updates production status.
- Admin can download latest asset.

## Metrics

### SWS-060 Admin Metrics Overview

Scope:

- Global counters.
- Top devices.
- Top clients.
- Time series by day.

Acceptance criteria:

- Admin sees all metrics.
- Counts match stored events.

### SWS-061 Client Metrics Overview

Scope:

- Client-owned device metrics.
- Device-level totals.
- QR vs NFC split.

Acceptance criteria:

- Client sees only own metrics.
- Time range filters work.

## Operations

### SWS-070 Audit Logs

Scope:

- Record admin support changes.
- Record target URL and status changes.
- Store before/after JSON.

Acceptance criteria:

- Important changes are traceable to an actor.
- Audit logs do not expose password hashes or secrets.

### SWS-071 Rate Limiting and Logging

Scope:

- Rate limit auth and redirect endpoints.
- Add request ID.
- Add structured logs.

Acceptance criteria:

- Redirect endpoint remains fast.
- Abusive traffic is limited.
- Errors are observable.
