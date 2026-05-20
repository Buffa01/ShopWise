import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { AuthModule } from "../auth/auth.module";
import { CodeGeneratorService } from "./code/code-generator.service";
import { DevicesController } from "./devices.controller";
import { DevicesService } from "./devices.service";

@Module({
  imports: [AuthModule, AssetsModule],
  controllers: [DevicesController],
  providers: [CodeGeneratorService, DevicesService],
  exports: [DevicesService]
})
export class DevicesModule {}
