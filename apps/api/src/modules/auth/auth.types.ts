import type { UserRole } from "@prisma/client";

export interface AuthUserResponse {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  businessId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUserResponse;
}

