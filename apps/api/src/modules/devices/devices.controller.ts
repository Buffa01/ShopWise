import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { Response } from "express";
import { CurrentUserDecorator } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { CurrentUser } from "../../common/types/authenticated-request";
import { AssignDeviceDto } from "./dto/assign-device.dto";
import { CreateDeviceBatchDto } from "./dto/create-device-batch.dto";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { ListDevicesQueryDto } from "./dto/list-devices-query.dto";
import { UpdateAdminDeviceDto } from "./dto/update-admin-device.dto";
import { DevicesService } from "./devices.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/devices")
export class DevicesController {
  constructor(@Inject(DevicesService) private readonly devicesService: DevicesService) {}

  @Get()
  list(@Query() query: ListDevicesQueryDto) {
    return this.devicesService.list(query);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.devicesService.get(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAdminDeviceDto,
    @CurrentUserDecorator() currentUser: CurrentUser
  ) {
    return this.devicesService.updateAdminDevice(id, dto, currentUser.id);
  }

  @Get(":id/assets/latest")
  async downloadLatestAsset(@Param("id") id: string, @Res() response: Response) {
    const result = await this.devicesService.getLatestPrintAssetFile(id);

    if (!result) {
      throw new NotFoundException({
        error: {
          code: "PRINT_ASSET_NOT_FOUND",
          message: "Print asset not found"
        }
      });
    }

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename=\"${result.publicCode}-sticker.pdf\"`);
    return response.send(result.file);
  }

  @Post()
  createOne(@Body() dto: CreateDeviceDto) {
    return this.devicesService.createOne(dto);
  }

  @Post("batch")
  createBatch(@Body() dto: CreateDeviceBatchDto, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.createBatch(dto, currentUser.id);
  }

  @Post(":id/assign")
  assign(
    @Param("id") id: string,
    @Body() dto: AssignDeviceDto,
    @CurrentUserDecorator() currentUser: CurrentUser
  ) {
    return this.devicesService.assignAdminDevice(id, dto.businessId, currentUser.id);
  }

  @Post(":id/unassign")
  unassign(@Param("id") id: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.unassignAdminDevice(id, currentUser.id);
  }
}
