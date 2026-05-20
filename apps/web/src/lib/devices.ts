import { apiRequest } from "./api";
import type { DeviceType } from "./device-types";
import { getAccessToken } from "./auth";

export type ProductionStatus = "CREATED" | "ASSET_GENERATED" | "DOWNLOADED" | "PRINTED" | "ERROR";
export type AssignmentStatus = "UNASSIGNED" | "ASSIGNED";
export type OperationalStatus = "INACTIVE" | "ACTIVE" | "PAUSED" | "DISABLED" | "ARCHIVED";

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
  productionStatus: ProductionStatus;
  assignmentStatus: AssignmentStatus;
  operationalStatus: OperationalStatus;
  createdAt: string;
  updatedAt: string;
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

