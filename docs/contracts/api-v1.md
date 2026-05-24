# API Contracts v1

Base API prefix:

```text
/v1
```

Public redirect endpoints may live outside `/v1`:

```text
GET /r/:code
GET /n/:code
```

## Error Shape

```json
{
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device not found",
    "details": {}
  }
}
```

## Auth

### `POST /v1/auth/register`

Creates a client user and business profile.

Request:

```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "password123",
  "businessName": "Cafe Centro"
}
```

### `POST /v1/auth/login`

Request:

```json
{
  "email": "ana@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "uuid",
    "email": "ana@example.com",
    "role": "CLIENT",
    "businessId": "uuid"
  }
}
```

### `GET /v1/auth/me`

Returns current authenticated user.

Requires:

```text
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "id": "uuid",
  "name": "Ana",
  "email": "ana@example.com",
  "role": "CLIENT",
  "businessId": "uuid"
}
```

## Admin Devices

## Admin Device Types

### `GET /v1/admin/device-types`

Admin-only. Lists device/product types.

### `POST /v1/admin/device-types`

Admin-only. Creates a device/product type.

Request:

```json
{
  "name": "Google Reviews",
  "slug": "google-review",
  "description": "Google Reviews QR + NFC sticker",
  "isActive": true,
  "defaultPrefix": "A",
  "templateKey": "sticker/google-review",
  "baseDesignKey": "designs/google-review-v1.pdf",
  "qrPosition": {
    "unit": "mm",
    "x": 0,
    "y": 0,
    "size": 35
  }
}
```

### `GET /v1/admin/device-types/:id`

Admin-only. Returns one device type.

### `PATCH /v1/admin/device-types/:id`

Admin-only. Updates one device type.

Use `isActive = false` to disable a type. Device types are not deleted in v1 because existing devices may depend on them.

### `POST /v1/admin/devices`

Creates one device.

Request:

```json
{
  "deviceTypeId": "uuid",
  "prefix": "A"
}
```

Response includes generated `publicCode`, `qrUrl`, and `nfcUrl`.

### `POST /v1/admin/devices/batch`

Creates devices in bulk.

Request:

```json
{
  "deviceTypeId": "uuid",
  "quantity": 100,
  "prefix": "A"
}
```

Response:

```json
{
  "batchId": "uuid",
  "quantity": 100,
  "status": "COMPLETED"
}
```

### `GET /v1/admin/devices`

Query params:

```text
q
businessId
productionStatus
assignmentStatus
operationalStatus
page
pageSize
```

### `GET /v1/admin/devices/:deviceId`

Returns full device detail.

### `PATCH /v1/admin/devices/:deviceId`

Admin update. Immutable fields cannot be changed.

Allowed fields:

```json
{
  "alias": "Mostrador Frente",
  "targetUrl": "https://g.page/r/...",
  "productionStatus": "PRINTED",
  "operationalStatus": "ACTIVE"
}
```

Rules:

- Immutable fields cannot be changed: `id`, `publicCode`, `qrUrl`, `nfcUrl`, paths.
- `ACTIVE` requires a configured `targetUrl`.
- Clearing `targetUrl` moves an active device back to `INACTIVE`.
- Records `AuditLog` and `DeviceEvent`.

### `POST /v1/admin/devices/:deviceId/assign`

Request:

```json
{
  "businessId": "uuid"
}
```

Assigns or reassigns the device to a client business. Records `AuditLog` and `DeviceEvent`.

### `POST /v1/admin/devices/:deviceId/unassign`

Unassigns a device and clears business-specific configuration (`alias`, `targetUrl`, owner, assigned timestamp). The device returns to `UNASSIGNED` and `INACTIVE`. Records `AuditLog` and `DeviceEvent`.

### `GET /v1/admin/devices/:deviceId/assets/latest/download`

Downloads or returns signed URL for latest print asset.

Current implementation:

```text
GET /v1/admin/devices/:deviceId/assets/latest
```

Returns the latest sticker PDF as `application/pdf`.

## Admin Audit Logs

### `GET /v1/admin/audit-logs`

Admin-only. Lists the latest audit records for support and operational review.

Query parameters:

```text
action
actorUserId
businessId
deviceId
```

Rules:

- Returns the latest 100 matching logs, ordered by newest first.
- Includes actor identity (`id`, `name`, `email`, `role`) when the action has an actor.
- Supports filtering by action text, actor, business, and device.
- Exposes `before` and `after` JSON snapshots for traceability.
- Must not expose password hashes, tokens, secrets, or sensitive request metadata.

Example response:

```json
[
  {
    "id": "uuid",
    "actorUserId": "uuid",
    "targetUserId": null,
    "businessId": "uuid",
    "deviceId": "uuid",
    "action": "ADMIN_DEVICE_UPDATE",
    "before": {
      "alias": "Mostrador"
    },
    "after": {
      "alias": "Caja"
    },
    "createdAt": "2026-05-24T10:00:00.000Z",
    "actor": {
      "id": "uuid",
      "name": "ShopWise Admin",
      "email": "admin@shopwise.uy",
      "role": "ADMIN"
    }
  }
]
```

## Admin Clients

### `GET /v1/admin/clients`

Admin-only. Lists client business profiles with owner email/name and device count.

### `POST /v1/admin/clients`

Admin-only. Creates a client user and business profile.

Request:

```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "temporary123",
  "businessName": "Cafe Centro",
  "phone": "+598...",
  "address": "Montevideo",
  "googleReviewUrl": "https://g.page/r/..."
}
```

### `GET /v1/admin/clients/:businessId`

Admin-only. Returns one client business, owner data, and assigned devices.

## Client Devices

### `GET /v1/devices`

Returns devices owned by current client.

### `POST /v1/devices/claim`

Client-only. Claims an unassigned device by public code. The API accepts the normalized short code only; the web UI may extract it from a pasted ShopWise QR/NFC URL before calling this endpoint.

Request:

```json
{
  "code": "A000001"
}
```

Response:

```json
{
  "id": "uuid",
  "publicCode": "A000001",
  "assignmentStatus": "ASSIGNED",
  "operationalStatus": "INACTIVE"
}
```

Rules:

- `DEVICE_NOT_FOUND` when the public code does not exist.
- `DEVICE_ALREADY_ASSIGNED` when the device already belongs to a business.
- `DEVICE_NOT_CLAIMABLE` when the device is disabled or archived.
- Claim is atomic to avoid double assignment.
- A `CLAIM` device event is recorded.

### `GET /v1/devices/:deviceId`

Client-only. Returns one owned device with latest events.

Rules:

- Clients can only fetch devices owned by their business.
- Non-owned devices return `DEVICE_FORBIDDEN`.

### `PATCH /v1/devices/:deviceId`

Client-only. Updates client-editable device configuration.

Request:

```json
{
  "alias": "Mostrador Frente",
  "targetUrl": "https://g.page/r/...",
  "operationalStatus": "ACTIVE"
}
```

Allowed `operationalStatus` values for clients:

```text
ACTIVE
PAUSED
INACTIVE
```

Rules:

- Clients cannot set `DISABLED` or `ARCHIVED`.
- `ACTIVE` requires a configured `targetUrl`.
- Empty `targetUrl` clears the destination and moves an active device back to `INACTIVE`.
- If an inactive device receives a valid `targetUrl` without an explicit status, it becomes `ACTIVE`.
- A `CONFIG_UPDATE` device event is recorded.

### `GET /v1/devices/:deviceId`

Client-owned device detail.

### `PATCH /v1/devices/:deviceId`

Allowed client fields:

```json
{
  "alias": "Mesa 1",
  "targetUrl": "https://g.page/r/...",
  "operationalStatus": "ACTIVE"
}
```

## Redirect

### `GET /r/:code`

QR redirect.

Behavior:

- Records `QR_SCAN`.
- Updates `lastScanAt`.
- Redirects if configured and active.
- Records `REDIRECT` when a redirect happens.
- Shows fallback if unconfigured.
- Shows error if invalid, disabled, or archived.

### `GET /n/:code`

NFC redirect.

Behavior:

- Records `NFC_TAP`.
- Updates `lastScanAt`.
- Same resolution rules as QR.

## Metrics

### `GET /v1/admin/metrics/overview`

Returns global counters, QR/NFC totals, redirects, scans by day, top devices, and top clients.

Response shape:

```json
{
  "totalDevices": 100,
  "activeDevices": 80,
  "assignedDevices": 75,
  "unassignedDevices": 25,
  "totalScans": 1234,
  "qrScans": 900,
  "nfcTaps": 334,
  "redirects": 1200,
  "scansByDay": [
    { "date": "2026-05-20", "total": 42, "qr": 30, "nfc": 12 }
  ],
  "topDevices": [
    {
      "deviceId": "uuid",
      "publicCode": "A000001",
      "alias": "Mostrador",
      "deviceTypeName": "Google Reviews",
      "businessName": "Cafe Centro",
      "scans": 100
    }
  ],
  "topClients": [
    { "businessId": "uuid", "businessName": "Cafe Centro", "scans": 100 }
  ]
}
```

### `GET /v1/admin/devices/:deviceId/metrics`

Admin-only. Returns metrics for one device.

### `GET /v1/metrics/overview`

Returns current client's aggregate metrics. The response includes only devices owned by the authenticated client's business.

### `GET /v1/devices/:deviceId/metrics`

Returns metrics for one client-owned device.
