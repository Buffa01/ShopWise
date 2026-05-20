import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  AdminDeviceMetricsController,
  AdminMetricsController,
  ClientDeviceMetricsController,
  ClientMetricsController
} from "./metrics.controller";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [AuthModule],
  controllers: [
    AdminMetricsController,
    AdminDeviceMetricsController,
    ClientMetricsController,
    ClientDeviceMetricsController
  ],
  providers: [MetricsService],
  exports: [MetricsService]
})
export class MetricsModule {}
