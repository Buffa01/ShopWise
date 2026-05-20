import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { DeviceTypesModule } from "./device-types/device-types.module";
import { DevicesModule } from "./devices/devices.module";
import { HealthModule } from "./health/health.module";
import { RedirectModule } from "./redirect/redirect.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"]
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    DeviceTypesModule,
    DevicesModule,
    RedirectModule,
    HealthModule
  ]
})
export class AppModule {}
