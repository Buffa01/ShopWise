# Backend Modules

## Module List

### Auth Module

Responsibilities:

- Register client users.
- Login.
- Password hashing.
- JWT access tokens.
- Refresh token support.
- Current user endpoint.

### Users Module

Responsibilities:

- User lookup.
- Role management by admin.
- Client profile association.

### Businesses Module

Responsibilities:

- Client business profile.
- Default Google Review URL.
- Admin customer list and detail views.

### Devices Module

Responsibilities:

- Create single device.
- Create devices in batch.
- Assign a product/device type to each device.
- Generate public codes and paths.
- Assign/unassign devices.
- Claim devices.
- Update alias, target URL, and statuses.
- Enforce immutable fields.

### Product Types Module

Responsibilities:

- Create and manage supported device/product types.
- Store product type name, slug, status, default prefix, and template/design references.
- Resolve default templates by type.
- Resolve default validation rules by type.
- Prepare the platform for future products such as Instagram, WhatsApp, menus, WiFi, TikTok, catalogs, payments, reservations, and order integrations.

### Redirect Module

Responsibilities:

- Resolve QR/NFC short URLs.
- Record scan/tap and redirect events.
- Redirect to configured destination.
- Serve fallback pages for unconfigured, disabled, invalid, or archived devices.

### Analytics Module

Responsibilities:

- Query global metrics.
- Query client metrics.
- Query per-device metrics.
- Expose time bucket aggregations.

### Assets Module

Responsibilities:

- Generate QR images.
- Render printable sticker/sign assets.
- Store assets in R2/S3.
- Track generated assets and download events.

### Audit Module

Responsibilities:

- Record important changes.
- Store before/after JSON snapshots.
- Provide admin audit queries later.

### Support Module

Responsibilities:

- Admin remote support operations.
- Support notes or future support tickets.

## Cross-Cutting Concerns

- `RolesGuard` for admin/client authorization.
- Ownership guard for client-owned devices.
- DTO validation with `class-validator` or Zod.
- Rate limiting on public redirect and auth endpoints.
- Request ID logging.
- Global exception filter with consistent error shape.
