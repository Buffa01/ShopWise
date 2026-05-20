# Roadmap

## Phase 0: Specs

Goal: define architecture and implementation contracts before coding.

Tasks:

- Write product brief.
- Decide architecture.
- Document ADRs.
- Define Prisma model draft.
- Define backend modules.
- Define frontend routes.
- Define API contracts.
- Define core flows.
- Define risks and open decisions.

Acceptance criteria:

- Docs are committed in repo.
- Initial stack decision is explicit.
- MVP scope is clear.
- First implementation tasks are actionable.

## Phase 1: System Base

Tasks:

- Initialize monorepo with Turborepo. Done.
- Create `apps/web` Next.js app. Done.
- Create `apps/api` NestJS app. Done.
- Add shared `packages/contracts`. Done.
- Add PostgreSQL and Prisma. Done.
- Add env validation.
- Implement auth. Done.
- Implement role guards. Done.
- Add base layouts for admin/client. In progress.

Acceptance criteria:

- Web and API run locally.
- Prisma migrations run.
- Client can register/login.
- Admin role can be seeded.
- Protected routes reject unauthorized users.

## Phase 2: Devices

Tasks:

- Implement admin-managed device types. Done.
- Implement device schema.
- Implement code generation service. Done.
- Implement single device creation. Done.
- Implement batch creation. Done.
- Generate QR/NFC URLs. Done.
- Add admin device list and detail. Done.
- Add filters and search.

Acceptance criteria:

- Admin can create one device.
- Admin can create a batch.
- Public codes are unique.
- Immutable fields cannot be edited.
- Device list shows production, assignment, and operational status.

## Phase 3: Redirect and Analytics

Tasks:

- Implement `GET /r/:code`.
- Implement `GET /n/:code`.
- Record scan/tap events.
- Anonymize IP metadata.
- Redirect to target URL.
- Add fallback page for unconfigured devices.

Acceptance criteria:

- QR path records `QR_SCAN`.
- NFC path records `NFC_TAP`.
- Active configured device redirects correctly.
- Unconfigured device shows fallback.
- Disabled/archived device does not redirect to target.

## Phase 4: Client Device Management

Tasks:

- Implement client dashboard.
- Implement claim endpoint.
- Implement scanner page.
- Implement device configuration screen.
- Validate target URLs.
- Add pause/activate actions.

Acceptance criteria:

- Client can claim an unassigned device.
- Client cannot claim assigned/disabled/archived devices.
- Client can only see own devices.
- Client can configure alias and target URL.

## Phase 5: Sticker Automation

Tasks:

- Add sticker template package.
- Generate QR image assets.
- Render sticker PNG/PDF.
- Upload assets to storage.
- Add admin download action.
- Track asset download event.

Acceptance criteria:

- Every new device can produce a QR image.
- Every new device can produce a print asset.
- Admin can download latest print asset.
- Failed generation is visible through production status.

## Phase 6: Metrics

Tasks:

- Build admin overview metrics.
- Build client overview metrics.
- Build device metrics.
- Add time bucket queries.
- Add top devices and top clients.

Acceptance criteria:

- Admin sees global counters.
- Client sees own counters only.
- Device detail shows total, QR, NFC, and last scan.
- Time series supports day/week/month views.

## Phase 7: Hardening and Launch

Tasks:

- Add audit log coverage.
- Add rate limiting.
- Add structured logging.
- Add integration tests for critical flows.
- Add deploy configuration.
- Add monitoring.
- Run real print/scan QA.

Acceptance criteria:

- Critical flows have automated tests.
- Redirect endpoint is monitored.
- Production env variables are documented.
- Physical QR/NFC samples pass real-world testing.

## First Programming Tasks

1. Initialize monorepo and package manager.
2. Add Next.js app in `apps/web`.
3. Add NestJS app in `apps/api`.
4. Add Prisma and PostgreSQL Docker Compose.
5. Encode enums and models from the domain spec.
6. Add seed script for first admin user.
7. Implement auth module.
8. Implement device code generation unit tests.
9. Implement admin single-device creation.
10. Implement public redirect skeleton.
