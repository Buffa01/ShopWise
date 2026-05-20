import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest, CurrentUser } from "../types/authenticated-request";

export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  }
);

