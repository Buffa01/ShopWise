import { apiRequest } from "./api";
import type { DeviceType } from "./device-types";
import { getAccessToken } from "./auth";

export type ProductionStatus = "CREATED" | "ASSET_GENERATED" | "DOWNLOADED" | "PRINTED" | "ERROR";
export type AssignmentStatus = "UNASSIGNED" | "ASSIGNED";
export type OperationalStatus = "INACTIVE" | "ACTIVE" | "PAUSED" | "DISABLED" | "ARCHIVED";
export type DeviceEventType =
  | "QR_SCAN"
  | "NFC_TAP"
  | "REDIRECT"
  | "CLAIM"
  | "CONFIG_UPDATE"
  | "STATUS_CHANGE"
  | "ASSET_GENERATED"
  | "ASSET_DOWNLOADED"
  | "ERROR";
export type DeviceEventSource = "QR" | "NFC" | "UNKNOWN" | "SYSTEM";

export interface DeviceEvent {
  id: string;
  eventType: DeviceEventType;
  source: DeviceEventSource;
  userAgent: string | null;
  referrer: string | null;
  createdAt: string;
}

export interface PrintAsset {
  id: string;
  templateKey: string;
  pngKey: string | null;
  pdfKey: string | null;
  widthMm: string | null;
  heightMm: string | null;
  dpi: number | null;
  createdAt: string;
}

export interface Device {
  id: string;
  deviceTypeId: string;
  deviceType: DeviceType;
  publicCode: string;
  qrPath: string;
  nfcPath: string;
  qrUrl: string;
  nfcUrl: string;
  targetUrl: string | null;
  alias: string | null;
  qrImageKey: string | null;
  latestPrintAssetId: string | null;
  productionStatus: ProductionStatus;
  assignmentStatus: AssignmentStatus;
  operationalStatus: OperationalStatus;
  lastScanAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: DeviceEvent[];
  printAssets?: PrintAsset[];
  business?: {
    id: string;
    businessName: string;
  } | null;
  batch?: {
    id: string;
    quantity: number;
  } | null;
}

export interface DeviceBatch {
  id: string;
  quantity: number;
  prefix: string | null;
  status: string;
  devices: Device[];
}

function authHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Missing access token");
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

export function listDevices() {
  return apiRequest<Device[]>("/admin/devices", {
    headers: authHeaders()
  });
}

export function getDevice(id: string) {
  return apiRequest<Device>(`/admin/devices/${id}`, {
    headers: authHeaders()
  });
}

export function getLatestPrintAssetUrl(id: string) {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/v1"}/admin/devices/${id}/assets/latest`;
}

export function createDevice(input: { deviceTypeId: string; prefix?: string }) {
  return apiRequest<Device>("/admin/devices", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}

export function createDeviceBatch(input: { deviceTypeId: string; quantity: number; prefix?: string }) {
  return apiRequest<DeviceBatch>("/admin/devices/batch", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}

export function listClientDevices() {
  return apiRequest<Device[]>("/devices", {
    headers: authHeaders()
  });
}

export function getClientDevice(id: string) {
  return apiRequest<Device>(`/devices/${id}`, {
    headers: authHeaders()
  });
}

export function claimClientDevice(code: string) {
  return apiRequest<Device>("/devices/claim", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ code })
  });
}

export function updateClientDevice(
  id: string,
  input: {
    alias?: string;
    targetUrl?: string;
    operationalStatus?: "INACTIVE" | "ACTIVE" | "PAUSED";
  }
) {
  return apiRequest<Device>(`/devices/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}
