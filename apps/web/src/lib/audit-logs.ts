import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  targetUserId: string | null;
  businessId: string | null;
  deviceId: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
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

export function listAuditLogs(query: {
  action?: string;
  actorUserId?: string;
  businessId?: string;
  deviceId?: string;
} = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<AuditLogEntry[]>(`/admin/audit-logs${suffix}`, {
    headers: authHeaders()
  });
}
