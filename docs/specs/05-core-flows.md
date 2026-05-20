# Core Flows

## Device Creation

1. Admin requests single or batch device creation.
2. API validates quantity and permissions.
3. API creates a `DeviceBatch` for batch creation.
4. API generates unique `publicCode` values.
5. API creates `qrPath`, `nfcPath`, `qrUrl`, and `nfcUrl`.
6. API stores device records with:
   - `productionStatus = CREATED`
   - `assignmentStatus = UNASSIGNED`
   - `operationalStatus = INACTIVE`
7. API generates QR images for `qrUrl`.
8. API generates print assets using the base template and QR image.
9. API uploads assets to object storage.
10. API updates device `productionStatus = ASSET_GENERATED`.
11. API records audit/event entries.

## Device Claim

1. Client logs in or registers.
2. Client opens "Add device".
3. Client scans QR or taps NFC.
4. App extracts the internal code from `/r/:code` or `/n/:code`.
5. Client calls `POST /v1/devices/claim`.
6. API validates:
   - Device exists.
   - Device is not assigned.
   - Device is not disabled or archived.
7. API assigns `businessId`.
8. API sets:
   - `assignmentStatus = ASSIGNED`
   - `operationalStatus = ACTIVE` if target URL exists, otherwise `INACTIVE`
9. API records `CLAIM` event and audit log.
10. Client is taken to device configuration.

## Public Redirect

1. Public visitor requests `GET /r/:code` or `GET /n/:code`.
2. API derives source:
   - `/r` means `QR`
   - `/n` means `NFC`
3. API looks up device by `publicCode`.
4. API records scan/tap event with anonymized request metadata.
5. API validates operational state.
6. If active and configured, API records `REDIRECT` and returns HTTP redirect to `targetUrl`.
7. If no target URL, API serves or redirects to fallback "not configured" page.
8. If invalid/disabled/archived, API serves a simple safe error page.

## Admin Remote Support

1. Admin opens client or device detail.
2. Admin edits alias, target URL, owner, or status.
3. API checks admin role.
4. API stores before/after audit log.
5. API records relevant `DeviceEvent`.
6. Client sees updated configuration immediately.

