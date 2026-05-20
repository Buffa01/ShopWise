import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { unauthorized } from "../errors/http-errors";
import type { AuthenticatedRequest, JwtAccessTokenPayload } from "../types/authenticated-request";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw unauthorized("AUTH_MISSING_TOKEN", "Missing bearer token");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessTokenPayload>(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      };
      return true;
    } catch {
      throw unauthorized("AUTH_INVALID_TOKEN", "Invalid or expired token");
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
