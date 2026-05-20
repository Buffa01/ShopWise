import type { Request } from "express";
import type { UserRole } from "@prisma/client";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtAccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: CurrentUser;
}

