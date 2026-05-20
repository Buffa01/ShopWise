import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DeviceTypesService } from "./device-types.service";
import { CreateDeviceTypeDto } from "./dto/create-device-type.dto";
import { UpdateDeviceTypeDto } from "./dto/update-device-type.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/device-types")
export class DeviceTypesController {
  constructor(@Inject(DeviceTypesService) private readonly deviceTypesService: DeviceTypesService) {}

  @Get()
  list() {
    return this.deviceTypesService.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.deviceTypesService.get(id);
  }

  @Post()
  create(@Body() dto: CreateDeviceTypeDto) {
    return this.deviceTypesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDeviceTypeDto) {
    return this.deviceTypesService.update(id, dto);
  }
}
