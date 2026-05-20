import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUserDecorator } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { CurrentUser } from "../../common/types/authenticated-request";
import { ClaimDeviceDto } from "./dto/claim-device.dto";
import { UpdateClientDeviceDto } from "./dto/update-client-device.dto";
import { DevicesService } from "./devices.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
@Controller("devices")
export class ClientDevicesController {
  constructor(@Inject(DevicesService) private readonly devicesService: DevicesService) {}

  @Get()
  list(@CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.listClientDevices(currentUser.id);
  }

  @Post("claim")
  claim(@Body() dto: ClaimDeviceDto, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.claim(dto, currentUser.id);
  }

  @Get(":id")
  get(@Param("id") id: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.getClientDevice(id, currentUser.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateClientDeviceDto,
    @CurrentUserDecorator() currentUser: CurrentUser
  ) {
    return this.devicesService.updateClientDevice(id, currentUser.id, dto);
  }
}

