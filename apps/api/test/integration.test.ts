import "reflect-metadata";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { json, urlencoded } from "express";
import type { INestApplication } from "@nestjs/common";
import { ApiExceptionFilter } from "../src/common/filters/api-exception.filter";
import { rateLimitMiddleware } from "../src/common/middleware/rate-limit.middleware";
import { requestLoggerMiddleware } from "../src/common/middleware/request-logger.middleware";
import { securityHeadersMiddleware } from "../src/common/middleware/security-headers.middleware";
import { AppModule } from "../src/modules/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "integration-test-secret";
process.env.RATE_LIMIT_AUTH_MAX = "1000";
process.env.RATE_LIMIT_REDIRECT_MAX = "1000";
process.env.STORAGE_DRIVER = "local";
process.env.STORAGE_LOCAL_DIR = "storage-test";
process.env.STORAGE_TOTAL_LIMIT_BYTES = "9000000000";
process.env.STORAGE_MAX_OBJECT_BYTES = "52428800";
process.env.SHORT_LINK_BASE_URL = "https://sw.test";

const TEST_RUN_ID = `it${Date.now()}`;
const TEST_PREFIX = "T11A";
const ADMIN_EMAIL = `admin-${TEST_RUN_ID}@shopwise.test`;
const ADMIN_PASSWORD = "change-me";
const CLIENT_PASSWORD = "change-me";

type JsonRecord = Record<string, unknown>;

interface ApiResponse<T> {
  status: number;
  headers: Headers;
  body: T;
}

async function main() {
  const app = await createApp();
  const prisma = app.get(PrismaService);
  const baseUrl = await getBaseUrl(app);

  try {
    await cleanTestData(prisma);
    await seedAdmin(prisma);

    const admin = await login(baseUrl, ADMIN_EMAIL, ADMIN_PASSWORD);
    const client = await registerClient(baseUrl, `client-${TEST_RUN_ID}@shopwise.test`, "Integration Test Business");

    await expectStatus(
      request(baseUrl, "/admin/me", {
        headers: authHeaders(admin.accessToken)
      }),
      200
    );
    await expectStatus(
      request(baseUrl, "/admin/me", {
        headers: authHeaders(client.accessToken)
      }),
      403
    );

    const deviceType = await createDeviceType(baseUrl, admin.accessToken);
    const designedDeviceType = await uploadDeviceTypeDesign(baseUrl, admin.accessToken, deviceType.id);
    assert.ok(designedDeviceType.baseDesignKey);
    await expectStatus(
      request(baseUrl, "/admin/device-types", {
        headers: authHeaders(client.accessToken)
      }),
      403
    );
    const designFile = await request<ArrayBuffer>(baseUrl, `/admin/device-types/${deviceType.id}/design`, {
      headers: authHeaders(admin.accessToken),
      parse: "arrayBuffer"
    });
    assert.equal(designFile.status, 200);
    assert.equal(designFile.headers.get("content-type"), "image/png");

    const device = await createDevice(baseUrl, admin.accessToken, deviceType.id);
    const publicCode = String(device.publicCode);
    assert.match(publicCode, /^T11A[0-9A-Z]{6}$/);
    assert.equal(device.productionStatus, "ASSET_GENERATED");
    assert.equal(device.assignmentStatus, "UNASSIGNED");
    assert.equal(device.operationalStatus, "INACTIVE");
    assert.equal(device.qrUrl, `https://sw.test/r/${publicCode}`);
    assert.equal(device.nfcUrl, `https://sw.test/n/${publicCode}`);

    const batch = await createBatch(baseUrl, admin.accessToken, deviceType.id);
    assert.equal(batch.quantity, 2);
    assert.equal(batch.devices.length, 2);
    assert.ok(batch.devices.every((item: JsonRecord) => String(item.publicCode).startsWith(TEST_PREFIX)));
    const batchSheet = await request<ArrayBuffer>(baseUrl, `/admin/devices/batches/${batch.id}/assets/sheet`, {
      headers: authHeaders(admin.accessToken),
      parse: "arrayBuffer"
    });
    assert.equal(batchSheet.status, 200);
    assert.equal(batchSheet.headers.get("content-type"), "application/pdf");
    assert.equal(batchSheet.headers.get("x-shopwise-sheet-width-mm"), "1300");

    const claimedDevice = await claimDevice(baseUrl, client.accessToken, publicCode);
    assert.equal(claimedDevice.id, device.id);
    assert.equal(claimedDevice.assignmentStatus, "ASSIGNED");
    assert.equal(claimedDevice.businessId, client.user.businessId);

    await expectStatus(
      request(baseUrl, "/devices/claim", {
        method: "POST",
        headers: authHeaders(client.accessToken),
        body: { code: publicCode }
      }),
      400
    );

    const configuredDevice = await patch<JsonRecord>(baseUrl, `/devices/${device.id}`, client.accessToken, {
      alias: "Integration Counter",
      targetUrl: "https://example.com/google-review",
      operationalStatus: "ACTIVE"
    });
    assert.equal(configuredDevice.alias, "Integration Counter");
    assert.equal(configuredDevice.targetUrl, "https://example.com/google-review");
    assert.equal(configuredDevice.operationalStatus, "ACTIVE");

    const qrRedirect = await request<string>(baseUrl, `/r/${publicCode}`, {
      redirect: "manual",
      parse: "text",
      headers: {
        "user-agent": "ShopWiseIntegrationTest/1.0"
      }
    });
    assert.equal(qrRedirect.status, 302);
    assert.equal(qrRedirect.headers.get("location"), "https://example.com/google-review");

    const nfcRedirect = await request<string>(baseUrl, `/n/${publicCode}`, {
      redirect: "manual",
      parse: "text",
      headers: {
        "user-agent": "ShopWiseIntegrationTest/1.0"
      }
    });
    assert.equal(nfcRedirect.status, 302);
    assert.equal(nfcRedirect.headers.get("location"), "https://example.com/google-review");

    const adminDeviceMetrics = await get<JsonRecord>(baseUrl, `/admin/devices/${device.id}/metrics`, admin.accessToken);
    assert.equal(adminDeviceMetrics.qrScans, 1);
    assert.equal(adminDeviceMetrics.nfcTaps, 1);
    assert.equal(adminDeviceMetrics.redirects, 2);

    const clientOverview = await get<JsonRecord>(baseUrl, "/metrics/overview", client.accessToken);
    assert.equal(clientOverview.totalScans, 2);
    assert.equal(clientOverview.qrScans, 1);
    assert.equal(clientOverview.nfcTaps, 1);

    const adminUpdatedDevice = await patch<JsonRecord>(baseUrl, `/admin/devices/${device.id}`, admin.accessToken, {
      alias: "Admin Support Alias"
    });
    assert.equal(adminUpdatedDevice.alias, "Admin Support Alias");

    const auditLogs = await get<JsonRecord[]>(baseUrl, `/admin/audit-logs?deviceId=${device.id}`, admin.accessToken);
    assert.ok(auditLogs.some((log) => log.action === "ADMIN_DEVICE_UPDATE"));
    await expectStatus(
      request(baseUrl, "/admin/audit-logs", {
        headers: authHeaders(client.accessToken)
      }),
      403
    );

    const assetDownload = await request<ArrayBuffer>(baseUrl, `/admin/devices/${device.id}/assets/latest`, {
      headers: authHeaders(admin.accessToken),
      parse: "arrayBuffer"
    });
    assert.equal(assetDownload.status, 200);
    assert.equal(assetDownload.headers.get("content-type"), "application/pdf");

    const storageUsage = await prisma.storageObject.aggregate({
      _sum: { byteSize: true },
      _count: true
    });
    assert.ok(storageUsage._count >= 4);
    assert.ok((storageUsage._sum.byteSize ?? 0n) > 0n);

    console.log("Integration tests passed");
  } finally {
    await cleanTestData(prisma);
    await rm(join(process.cwd(), "../../", process.env.STORAGE_LOCAL_DIR ?? "storage-test"), {
      force: true,
      recursive: true
    });
    await app.close();
  }
}

async function createApp() {
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: false });
  const httpServer = app.getHttpAdapter().getInstance() as {
    disable?: (setting: string) => void;
    set?: (setting: string, value: unknown) => void;
  };

  httpServer.disable?.("x-powered-by");
  httpServer.set?.("trust proxy", true);
  app.use(json({ limit: "15mb" }));
  app.use(urlencoded({ extended: true, limit: "15mb" }));
  app.setGlobalPrefix("v1", {
    exclude: ["r/:code", "n/:code"]
  });
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.use(securityHeadersMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(rateLimitMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(0);
  return app;
}

async function getBaseUrl(app: INestApplication) {
  const server = app.getHttpServer() as {
    address: () => string | { port: number } | null;
  };
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not resolve integration test server address");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function cleanTestData(prisma: PrismaService) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "@shopwise.test" } },
        { email: { startsWith: "admin-it" } },
        { email: { startsWith: "client-it" } }
      ]
    },
    select: { id: true }
  });
  const userIds = users.map((user) => user.id);
  const businesses = await prisma.business.findMany({
    where: {
      OR: [{ ownerUserId: { in: userIds } }, { businessName: { contains: "Integration Test" } }]
    },
    select: { id: true }
  });
  const businessIds = businesses.map((business) => business.id);
  const deviceTypes = await prisma.deviceType.findMany({
    where: { slug: { startsWith: "integration-" } },
    select: { id: true }
  });
  const deviceTypeIds = deviceTypes.map((deviceType) => deviceType.id);
  const devices = await prisma.device.findMany({
    where: {
      OR: [
        { publicCode: { startsWith: TEST_PREFIX } },
        { deviceTypeId: { in: deviceTypeIds } },
        { businessId: { in: businessIds } }
      ]
    },
    select: { id: true, batchId: true }
  });
  const deviceIds = devices.map((device) => device.id);
  const batchIds = devices.flatMap((device) => (device.batchId ? [device.batchId] : []));

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actorUserId: { in: userIds } },
        { targetUserId: { in: userIds } },
        { businessId: { in: businessIds } },
        { deviceId: { in: deviceIds } }
      ]
    }
  });
  await prisma.storageObject.deleteMany({
    where: {
      OR: [
        { key: { startsWith: `devices/${TEST_PREFIX}` } },
        ...deviceTypeIds.map((id) => ({ key: { startsWith: `device-types/${id}/` } }))
      ]
    }
  });
  await prisma.printAsset.deleteMany({ where: { deviceId: { in: deviceIds } } });
  await prisma.deviceDailyMetric.deleteMany({ where: { deviceId: { in: deviceIds } } });
  await prisma.deviceEvent.deleteMany({
    where: {
      OR: [
        { deviceId: { in: deviceIds } },
        { metadata: { path: ["publicCode"], string_starts_with: TEST_PREFIX } }
      ]
    }
  });
  await prisma.device.deleteMany({ where: { id: { in: deviceIds } } });
  await prisma.deviceBatch.deleteMany({ where: { id: { in: batchIds } } });
  await prisma.deviceType.deleteMany({ where: { id: { in: deviceTypeIds } } });
  await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.codeSequence.deleteMany({ where: { prefix: TEST_PREFIX } });
}

async function seedAdmin(prisma: PrismaService) {
  await prisma.user.create({
    data: {
      name: "Integration Admin",
      email: ADMIN_EMAIL,
      passwordHash: await hash(ADMIN_PASSWORD, 12),
      role: UserRole.ADMIN
    }
  });
}

async function login(baseUrl: string, email: string, password: string) {
  const response = await request<{ accessToken: string; user: JsonRecord }>(baseUrl, "/auth/login", {
    method: "POST",
    body: { email, password }
  });
  assert.equal(response.status, 201);
  assert.ok(response.body.accessToken);
  return response.body;
}

async function registerClient(baseUrl: string, email: string, businessName: string) {
  const response = await request<{ accessToken: string; user: JsonRecord }>(baseUrl, "/auth/register", {
    method: "POST",
    body: {
      name: "Integration Client",
      email,
      password: CLIENT_PASSWORD,
      businessName
    }
  });
  assert.equal(response.status, 201);
  assert.ok(response.body.accessToken);
  assert.ok(response.body.user.businessId);
  return response.body;
}

async function createDeviceType(baseUrl: string, accessToken: string) {
  const response = await request<JsonRecord>(baseUrl, "/admin/device-types", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: {
      name: "Integration Google Reviews",
      slug: `integration-google-${TEST_RUN_ID.toLowerCase()}`,
      description: "Integration test device type",
      isActive: true,
      defaultPrefix: TEST_PREFIX,
      templateKey: "sticker/integration",
      qrPosition: {
        unit: "mm",
        sticker: {
          shape: "circle",
          widthMm: 100,
          heightMm: 100,
          diameterMm: 100
        },
        qr: {
          xMm: 34,
          yMm: 34,
          widthMm: 32,
          heightMm: 32
        }
      }
    }
  });
  assert.equal(response.status, 201);
  return response.body;
}

async function uploadDeviceTypeDesign(baseUrl: string, accessToken: string, deviceTypeId: unknown) {
  const response = await request<JsonRecord>(baseUrl, `/admin/device-types/${deviceTypeId}/design`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: {
      contentType: "image/png",
      fileName: "integration-sticker.png",
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
    }
  });
  assert.equal(response.status, 201);
  return response.body;
}

async function createDevice(baseUrl: string, accessToken: string, deviceTypeId: unknown) {
  const response = await request<JsonRecord>(baseUrl, "/admin/devices", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: {
      deviceTypeId,
      prefix: TEST_PREFIX
    }
  });
  assert.equal(response.status, 201);
  return response.body;
}

async function createBatch(baseUrl: string, accessToken: string, deviceTypeId: unknown) {
  const response = await request<JsonRecord & { devices: JsonRecord[] }>(baseUrl, "/admin/devices/batch", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: {
      deviceTypeId,
      quantity: 2,
      prefix: TEST_PREFIX
    }
  });
  assert.equal(response.status, 201);
  return response.body;
}

async function claimDevice(baseUrl: string, accessToken: string, code: unknown) {
  const response = await request<JsonRecord>(baseUrl, "/devices/claim", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: { code }
  });
  assert.equal(response.status, 201);
  return response.body;
}

async function get<T>(baseUrl: string, path: string, accessToken: string) {
  const response = await request<T>(baseUrl, path, {
    headers: authHeaders(accessToken)
  });
  assert.equal(response.status, 200);
  return response.body;
}

async function patch<T>(baseUrl: string, path: string, accessToken: string, body: JsonRecord) {
  const response = await request<T>(baseUrl, path, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body
  });
  assert.equal(response.status, 200);
  return response.body;
}

async function expectStatus<T>(promise: Promise<ApiResponse<T>>, status: number) {
  const response = await promise;
  assert.equal(response.status, status);
  return response;
}

function authHeaders(accessToken: string) {
  return {
    authorization: `Bearer ${accessToken}`
  };
}

async function request<T>(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    redirect?: "follow" | "error" | "manual";
    parse?: "json" | "text" | "arrayBuffer";
  } = {}
): Promise<ApiResponse<T>> {
  const apiPath = path.startsWith("/r/") || path.startsWith("/n/") ? path : `/v1${path}`;
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method: options.method ?? "GET",
    redirect: options.redirect,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  return {
    status: response.status,
    headers: response.headers,
    body: await parseBody<T>(response, options.parse)
  };
}

async function parseBody<T>(response: Response, parse: "json" | "text" | "arrayBuffer" = "json") {
  if (parse === "arrayBuffer") {
    return response.arrayBuffer() as Promise<T>;
  }

  const text = await response.text();
  if (parse === "text") {
    return text as T;
  }

  return (text ? JSON.parse(text) : null) as T;
}

process.on("unhandledRejection", (reason) => {
  console.error(reason);
  process.exit(1);
});

main().catch((error) => {
  const digest = createHash("sha1").update(error instanceof Error ? error.stack ?? error.message : String(error)).digest("hex");
  console.error(`Integration tests failed (${digest})`);
  console.error(error);
  process.exit(1);
});
