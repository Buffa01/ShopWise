import { apiRequest } from "./api";
import { getAccessToken } from "./auth";
import type { DeviceEventSource, DeviceEventType } from "./devices";

export interface MetricPoint {
  date: string;
  total: number;
  qr: number;
  nfc: number;
}

export interface TopDeviceMetric {
  deviceId: string | null;
  publicCode: string;
  alias: string | null;
  deviceTypeName: string | null;
  businessName: string | null;
  scans: number;
}

export interface TopClientMetric {
  businessId: string;
  businessName: string;
  scans: number;
}

export interface LatestMetricEvent {
  id: string;
  eventType: DeviceEventType;
  source: DeviceEventSource;
  referrer: string | null;
  createdAt: string;
  device?: {
    id: string;
    publicCode: string;
    alias: string | null;
  } | null;
}

export interface OverviewMetrics {
  totalDevices: number;
  activeDevices: number;
  assignedDevices: number;
  unassignedDevices: number;
  totalScans: number;
  qrScans: number;
  nfcTaps: number;
  redirects: number;
  scansByDay: MetricPoint[];
  topDevices: TopDeviceMetric[];
  topClients?: TopClientMetric[];
  latestEvents?: LatestMetricEvent[];
}

export interface DeviceMetrics {
  totalScans: number;
  qrScans: number;
  nfcTaps: number;
  redirects: number;
  scansByDay: MetricPoint[];
  latestEvents: LatestMetricEvent[];
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

export function getAdminOverviewMetrics() {
  return apiRequest<OverviewMetrics>("/admin/metrics/overview", {
    headers: authHeaders()
  });
}

export function getClientOverviewMetrics() {
  return apiRequest<OverviewMetrics>("/metrics/overview", {
    headers: authHeaders()
  });
}

export function getAdminDeviceMetrics(id: string) {
  return apiRequest<DeviceMetrics>(`/admin/devices/${id}/metrics`, {
    headers: authHeaders()
  });
}

export function getClientDeviceMetrics(id: string) {
  return apiRequest<DeviceMetrics>(`/devices/${id}/metrics`, {
    headers: authHeaders()
  });
}
