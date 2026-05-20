# Domain Model

## Core Concepts

- `User`: login identity.
- `Business`: client business profile.
- `Device`: physical QR/NFC unit.
- `DeviceBatch`: group creation record for manufacturing/printing.
- `DeviceEvent`: append-only interaction and lifecycle events.
- `AuditLog`: admin/client configuration change trail.
- `PrintAsset`: generated printable output metadata.

## Prisma Draft

```prisma
enum UserRole {
  ADMIN
  CLIENT
}

enum ProductionStatus {
  CREATED
  ASSET_GENERATED
  DOWNLOADED
  PRINTED
  ERROR
}

enum AssignmentStatus {
  UNASSIGNED
  ASSIGNED
}

enum OperationalStatus {
  INACTIVE
  ACTIVE
  PAUSED
  DISABLED
  ARCHIVED
}

enum DeviceEventType {
  QR_SCAN
  NFC_TAP
  REDIRECT
  CLAIM
  CONFIG_UPDATE
  STATUS_CHANGE
  ASSET_GENERATED
  ASSET_DOWNLOADED
  ERROR
}

enum DeviceEventSource {
  QR
  NFC
  UNKNOWN
  SYSTEM
}

enum BatchStatus {
  PENDING
  GENERATING
  COMPLETED
  PARTIAL_ERROR
  FAILED
}

model User {
  id           String   @id @default(uuid())
  name         String?
  email        String   @unique
  passwordHash String
  role         UserRole @default(CLIENT)
  business     Business?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdBatches DeviceBatch[] @relation("BatchCreator")
  auditLogs      AuditLog[]    @relation("AuditActor")
}

model Business {
  id                String   @id @default(uuid())
  ownerUserId       String   @unique
  owner             User     @relation(fields: [ownerUserId], references: [id])
  businessName      String
  phone             String?
  address           String?
  defaultTargetUrl  String?
  googleReviewUrl   String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  devices Device[]
}

model DeviceType {
  id             String   @id @default(uuid())
  name           String
  slug           String   @unique
  description    String?
  isActive       Boolean  @default(true)
  defaultPrefix  String?
  templateKey    String?
  baseDesignKey  String?
  qrPosition     Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  devices Device[]
}

model Device {
  id                 String             @id @default(uuid())
  deviceTypeId       String
  deviceType         DeviceType         @relation(fields: [deviceTypeId], references: [id])
  publicCode         String             @unique
  qrPath             String             @unique
  nfcPath            String             @unique
  qrUrl              String             @unique
  nfcUrl             String             @unique
  targetUrl          String?
  alias              String?
  businessId         String?
  business           Business?          @relation(fields: [businessId], references: [id])
  batchId            String?
  batch              DeviceBatch?       @relation(fields: [batchId], references: [id])
  productionStatus   ProductionStatus   @default(CREATED)
  assignmentStatus   AssignmentStatus   @default(UNASSIGNED)
  operationalStatus  OperationalStatus  @default(INACTIVE)
  qrImageKey         String?
  latestPrintAssetId String?
  assignedAt         DateTime?
  lastScanAt         DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  events      DeviceEvent[]
  printAssets PrintAsset[]

  @@index([businessId])
  @@index([deviceTypeId])
  @@index([batchId])
  @@index([assignmentStatus, operationalStatus])
  @@index([lastScanAt])
}

model DeviceBatch {
  id          String      @id @default(uuid())
  quantity    Int
  prefix      String?
  status      BatchStatus @default(PENDING)
  createdById String
  createdBy   User        @relation("BatchCreator", fields: [createdById], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  devices Device[]
}

model PrintAsset {
  id          String   @id @default(uuid())
  deviceId    String
  device      Device   @relation(fields: [deviceId], references: [id])
  templateKey String
  pngKey      String?
  pdfKey      String?
  svgKey      String?
  widthMm     Decimal?
  heightMm    Decimal?
  dpi         Int?
  createdAt   DateTime @default(now())

  @@index([deviceId])
}

model DeviceEvent {
  id          String            @id @default(uuid())
  deviceId    String?
  device      Device?           @relation(fields: [deviceId], references: [id])
  eventType   DeviceEventType
  source      DeviceEventSource @default(UNKNOWN)
  userAgent   String?
  ipHash      String?
  referrer    String?
  metadata    Json?
  createdAt   DateTime          @default(now())

  @@index([deviceId, createdAt])
  @@index([eventType, createdAt])
  @@index([source, createdAt])
}

model AuditLog {
  id           String   @id @default(uuid())
  actorUserId  String?
  actor        User?    @relation("AuditActor", fields: [actorUserId], references: [id])
  targetUserId String?
  businessId   String?
  deviceId     String?
  action       String
  before       Json?
  after        Json?
  createdAt    DateTime @default(now())

  @@index([actorUserId])
  @@index([deviceId])
  @@index([createdAt])
}
```

## Notes

- `publicCode` is not the database primary key.
- `qrPath` and `nfcPath` allow path-level uniqueness independent from full domain.
- `targetUrl` is nullable so devices can exist before client configuration.
- `PrintAsset` is separate to support future regenerated versions.
- `DeviceEvent.deviceId` is nullable so invalid-code attempts can be logged without a matching device.
- `DeviceType` is database-managed, not a hardcoded enum, so admins can create future product types and attach a base design/template before creating devices.
