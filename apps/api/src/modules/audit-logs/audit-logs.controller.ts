import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuditLogsService } from "./audit-logs.service";
import { ListAuditLogsQueryDto } from "./dto/list-audit-logs-query.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/audit-logs")
export class AuditLogsController {
  constructor(@Inject(AuditLogsService) private readonly auditLogsService: AuditLogsService) {}

  @Get()
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsService.list(query);
  }
}
