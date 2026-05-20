# Acceptance Criteria

## Global Definition of Done

Every implemented feature should meet these criteria unless explicitly exempted:

- Has a documented route, endpoint, or module owner.
- Validates input at API boundaries.
- Returns standard error shape.
- Enforces role and ownership rules.
- Emits audit logs for important state changes.
- Does not expose sensitive fields.
- Has focused tests for core business rules.
- Updates docs when contracts change.

## Device Lifecycle

- A created device has immutable `publicCode`, `qrUrl`, and `nfcUrl`.
- A device can exist without owner and without target URL.
- A device cannot redirect to a target unless it is active and configured.
- A disabled or archived device cannot be claimed.
- Assignment and operational status transitions are explicit.

## Short Links

- QR and NFC URLs always point to ShopWise.
- QR and NFC use separate paths.
- Public codes are unique.
- Public codes are not database IDs.
- NFC URLs remain short and do not use query tracking parameters.

## Claims

- Only authenticated clients can claim devices.
- Admin can manually assign and unassign devices.
- Clients cannot claim already assigned devices.
- Claim events are recorded.
- Claim support path is available for disputed ownership.

## Analytics

- QR scans and NFC taps are stored separately.
- Redirects are stored as events.
- IP addresses are anonymized or hashed.
- Client metrics include only the client's devices.
- Admin metrics can aggregate across all devices.

## Sticker Assets

- The QR embedded in print assets points to the internal QR URL.
- The base design can be versioned.
- Generated assets are stored outside the database.
- Asset downloads are trackable.
- Failed asset generation is visible to admins.

## Security

- Passwords are never stored in plain text.
- Clients cannot access other clients' devices or metrics.
- Admin-only endpoints reject client users.
- Target URLs are validated.
- Public redirect endpoint is rate limited.

