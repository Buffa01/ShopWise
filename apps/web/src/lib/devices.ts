import { API_BASE_URL, apiRequest } from "./api";
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
    owner?: {
      id: string;
      name: string | null;
      email: string;
    };
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

export function listDevices(query: {
  q?: string;
  assignmentStatus?: AssignmentStatus;
  operationalStatus?: OperationalStatus;
  productionStatus?: ProductionStatus;
  deviceTypeId?: string;
  businessId?: string;
} = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<Device[]>(`/admin/devices${suffix}`, {
    headers: authHeaders()
  });
}

export function getDevice(id: string) {
  return apiRequest<Device>(`/admin/devices/${id}`, {
    headers: authHeaders()
  });
}

export function getLatestPrintAssetUrl(id: string) {
  return `${API_BASE_URL}/admin/devices/${id}/assets/latest`;
}

export function getBatchPrintSheetUrl(batchId: string) {
  return `${API_BASE_URL}/admin/devices/batches/${batchId}/assets/sheet`;
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

export function updateAdminDevice(
  id: string,
  input: {
    alias?: string;
    targetUrl?: string;
    productionStatus?: ProductionStatus;
    operationalStatus?: OperationalStatus;
  }
) {
  return apiRequest<Device>(`/admin/devices/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}

export function assignAdminDevice(id: string, businessId: string) {
  return apiRequest<Device>(`/admin/devices/${id}/assign`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ businessId })
  });
}

export function unassignAdminDevice(id: string) {
  return apiRequest<Device>(`/admin/devices/${id}/unassign`, {
    method: "POST",
    headers: authHeaders()
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
