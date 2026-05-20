import { apiRequest } from "./api";
import { getAccessToken } from "./auth";
import type { Device } from "./devices";

export interface ClientBusiness {
  id: string;
  ownerUserId: string;
  businessName: string;
  phone: string | null;
  address: string | null;
  defaultTargetUrl: string | null;
  googleReviewUrl: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
  _count?: {
    devices: number;
  };
  devices?: Device[];
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

export function listClients() {
  return apiRequest<ClientBusiness[]>("/admin/clients", {
    headers: authHeaders()
  });
}

export function getClient(id: string) {
  return apiRequest<ClientBusiness>(`/admin/clients/${id}`, {
    headers: authHeaders()
  });
}

export function createClient(input: {
  name?: string;
  email: string;
  password: string;
  businessName: string;
  phone?: string;
  address?: string;
  defaultTargetUrl?: string;
  googleReviewUrl?: string;
}) {
  return apiRequest<ClientBusiness>("/admin/clients", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}
