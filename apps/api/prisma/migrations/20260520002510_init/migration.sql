-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('CREATED', 'ASSET_GENERATED', 'DOWNLOADED', 'PRINTED', 'ERROR');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAUSED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DeviceEventType" AS ENUM ('QR_SCAN', 'NFC_TAP', 'REDIRECT', 'CLAIM', 'CONFIG_UPDATE', 'STATUS_CHANGE', 'ASSET_GENERATED', 'ASSET_DOWNLOADED', 'ERROR');

-- CreateEnum
CREATE TYPE "DeviceEventSource" AS ENUM ('QR', 'NFC', 'UNKNOWN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'PARTIAL_ERROR', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "defaultTargetUrl" TEXT,
    "googleReviewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultPrefix" TEXT,
    "templateKey" TEXT,
    "baseDesignKey" TEXT,
    "qrPosition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceTypeId" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "qrPath" TEXT NOT NULL,
    "nfcPath" TEXT NOT NULL,
    "qrUrl" TEXT NOT NULL,
    "nfcUrl" TEXT NOT NULL,
    "targetUrl" TEXT,
    "alias" TEXT,
    "businessId" TEXT,
    "batchId" TEXT,
    "productionStatus" "ProductionStatus" NOT NULL DEFAULT 'CREATED',
    "assignmentStatus" "AssignmentStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "operationalStatus" "OperationalStatus" NOT NULL DEFAULT 'INACTIVE',
    "qrImageKey" TEXT,
    "latestPrintAssetId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "lastScanAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceBatch" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "prefix" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintAsset" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "pngKey" TEXT,
    "pdfKey" TEXT,
    "svgKey" TEXT,
    "widthMm" DECIMAL(65,30),
    "heightMm" DECIMAL(65,30),
    "dpi" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "eventType" "DeviceEventType" NOT NULL,
    "source" "DeviceEventSource" NOT NULL DEFAULT 'UNKNOWN',
    "userAgent" TEXT,
    "ipHash" TEXT,
    "referrer" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceDailyMetric" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" "DeviceEventSource" NOT NULL,
    "scans" INTEGER NOT NULL DEFAULT 0,
    "redirects" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "businessId" TEXT,
    "deviceId" TEXT,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Business_ownerUserId_key" ON "Business"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceType_slug_key" ON "DeviceType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Device_publicCode_key" ON "Device"("publicCode");

-- CreateIndex
CREATE UNIQUE INDEX "Device_qrPath_key" ON "Device"("qrPath");

-- CreateIndex
CREATE UNIQUE INDEX "Device_nfcPath_key" ON "Device"("nfcPath");

-- CreateIndex
CREATE UNIQUE INDEX "Device_qrUrl_key" ON "Device"("qrUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Device_nfcUrl_key" ON "Device"("nfcUrl");

-- CreateIndex
CREATE INDEX "Device_businessId_idx" ON "Device"("businessId");

-- CreateIndex
CREATE INDEX "Device_deviceTypeId_idx" ON "Device"("deviceTypeId");

-- CreateIndex
CREATE INDEX "Device_batchId_idx" ON "Device"("batchId");

-- CreateIndex
CREATE INDEX "Device_assignmentStatus_operationalStatus_idx" ON "Device"("assignmentStatus", "operationalStatus");

-- CreateIndex
CREATE INDEX "Device_lastScanAt_idx" ON "Device"("lastScanAt");

-- CreateIndex
CREATE INDEX "PrintAsset_deviceId_idx" ON "PrintAsset"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceEvent_deviceId_createdAt_idx" ON "DeviceEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "DeviceEvent_eventType_createdAt_idx" ON "DeviceEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "DeviceEvent_source_createdAt_idx" ON "DeviceEvent"("source", "createdAt");

-- CreateIndex
CREATE INDEX "DeviceDailyMetric_date_idx" ON "DeviceDailyMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceDailyMetric_deviceId_date_source_key" ON "DeviceDailyMetric"("deviceId", "date", "source");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_deviceId_idx" ON "AuditLog"("deviceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "DeviceBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceBatch" ADD CONSTRAINT "DeviceBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintAsset" ADD CONSTRAINT "PrintAsset_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceEvent" ADD CONSTRAINT "DeviceEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceDailyMetric" ADD CONSTRAINT "DeviceDailyMetric_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
