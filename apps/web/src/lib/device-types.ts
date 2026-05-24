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

export interface StickerQrPosition {
  unit: "mm";
  sticker: {
    shape: "circle" | "rectangle";
    widthMm: number;
    heightMm: number;
    diameterMm?: number;
  };
  qr: {
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
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
  qrPosition?: Record<string, unknown> | StickerQrPosition;
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

export function uploadDeviceTypeDesign(id: string, input: {
  contentType: "image/png" | "image/jpeg";
  fileName: string;
  dataUrl: string;
}) {
  return apiRequest<DeviceType>(`/admin/device-types/${id}/design`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}

export async function getDeviceTypeDesignUrl(id: string) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Missing access token");
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/v1"}/admin/device-types/${id}/design`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return URL.createObjectURL(await response.blob());
}
