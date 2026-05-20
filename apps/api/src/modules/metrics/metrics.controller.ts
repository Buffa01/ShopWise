import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUserDecorator } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { CurrentUser } from "../../common/types/authenticated-request";
import { MetricsService } from "./metrics.service";

@UseGuards(JwtAuthGuard, RolesGuard)
export class MetricsController {
  constructor(@Inject(MetricsService) protected readonly metricsService: MetricsService) {}
}

@Roles(UserRole.ADMIN)
@Controller("admin/metrics")
export class AdminMetricsController extends MetricsController {
  @Get("overview")
  getOverview() {
    return this.metricsService.getAdminOverview();
  }
}

@Roles(UserRole.ADMIN)
@Controller("admin/devices")
export class AdminDeviceMetricsController extends MetricsController {
  @Get(":id/metrics")
  getDeviceMetrics(@Param("id") id: string) {
    return this.metricsService.getAdminDeviceMetrics(id);
  }
}

@Roles(UserRole.CLIENT)
@Controller("metrics")
export class ClientMetricsController extends MetricsController {
  @Get("overview")
  getOverview(@CurrentUserDecorator() currentUser: CurrentUser) {
    return this.metricsService.getClientOverview(currentUser.id);
  }
}

@Roles(UserRole.CLIENT)
@Controller("devices")
export class ClientDeviceMetricsController extends MetricsController {
  @Get(":id/metrics")
  getDeviceMetrics(@Param("id") id: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.metricsService.getClientDeviceMetrics(id, currentUser.id);
  }
}
