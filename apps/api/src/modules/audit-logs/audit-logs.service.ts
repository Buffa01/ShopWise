import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { ListAuditLogsQueryDto } from "./dto/list-audit-logs-query.dto";

@Injectable()
export class AuditLogsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(query: ListAuditLogsQueryDto) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.action) where.action = { contains: query.action, mode: "insensitive" };
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.businessId) where.businessId = query.businessId;
    if (query.deviceId) where.deviceId = query.deviceId;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });
  }
}
