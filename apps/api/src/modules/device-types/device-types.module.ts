import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { AuthModule } from "../auth/auth.module";
import { DeviceTypesController } from "./device-types.controller";
import { DeviceTypesService } from "./device-types.service";

@Module({
  imports: [AssetsModule, AuthModule],
  controllers: [DeviceTypesController],
  providers: [DeviceTypesService],
  exports: [DeviceTypesService]
})
export class DeviceTypesModule {}
