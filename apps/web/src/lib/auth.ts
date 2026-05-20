import { apiRequest } from "./api";

const TOKEN_KEY = "shopwise_access_token";

export type UserRole = "ADMIN" | "CLIENT";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  businessId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getHomePathForRole(role: UserRole) {
  return role === "ADMIN" ? "/admin" : "/app";
}

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function register(input: {
  name?: string;
  email: string;
  password: string;
  businessName: string;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getMe(token: string) {
  return apiRequest<AuthUser>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

