# Frontend Routes

## Route Groups

```text
/
/login
/register

/admin
/admin/devices
/admin/devices/new
/admin/devices/batch
/admin/devices/:deviceId
/admin/device-types
/admin/device-types/new
/admin/device-types/:deviceTypeId
/admin/clients
/admin/clients/:businessId
/admin/metrics

/app
/app/onboarding
/app/devices
/app/devices/add
/app/devices/scan
/app/devices/:deviceId
/app/devices/:deviceId/metrics
/app/support

/r/:code
/n/:code
/claim/:code
/device-unconfigured
/device-invalid
```

## Notes

- Public redirect routes may be handled directly by the API domain `sw.uy`. The web app can still own fallback UI pages if desired.
- Admin and client routes should use separate layouts.
- Client device IDs in URLs should use internal UUIDs after authentication, not short public codes.
- Claim routes can accept a public code but must complete through authenticated API calls.

## Main Screens

### Admin

- Login.
- Dashboard.
- Device list with filters by code, client, alias, assignment status, operational status, production status.
- Single device creation.
- Batch device creation.
- Device detail and support configuration.
- Device type creation and template/design upload.
- Printable asset download.
- Client list.
- Client detail with device list.
- Metrics dashboard.

### Client

- Register.
- Login.
- Onboarding.
- Dashboard.
- My devices.
- Add device.
- QR scanner.
- Device detail/configuration.
- Device metrics.
- Support/instructions.

### Public

- Redirect by QR path.
- Redirect by NFC path.
- Fallback if unconfigured.
- Error page if invalid/disabled.
