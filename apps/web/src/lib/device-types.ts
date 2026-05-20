import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export interface DeviceType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  defaultPrefix: string | null;
  templateKey: string | null;
  baseDesignKey: string | null;
  qrPosition: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    devices: number;
  };
}

export interface DeviceTypeInput {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  defaultPrefix?: string;
  templateKey?: string;
  baseDesignKey?: string;
  qrPosition?: Record<string, unknown>;
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

export function listDeviceTypes() {
  return apiRequest<DeviceType[]>("/admin/device-types", {
    headers: authHeaders()
  });
}

export function getDeviceType(id: string) {
  return apiRequest<DeviceType>(`/admin/device-types/${id}`, {
    headers: authHeaders()
  });
}

export function createDeviceType(input: DeviceTypeInput) {
  return apiRequest<DeviceType>("/admin/device-types", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}

export function updateDeviceType(id: string, input: Partial<DeviceTypeInput>) {
  return apiRequest<DeviceType>(`/admin/device-types/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}

