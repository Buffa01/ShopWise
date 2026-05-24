import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { Response } from "express";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DeviceTypesService } from "./device-types.service";
import { CreateDeviceTypeDto } from "./dto/create-device-type.dto";
import { UpdateDeviceTypeDto } from "./dto/update-device-type.dto";
import { UploadDeviceTypeDesignDto } from "./dto/upload-device-type-design.dto";

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

  @Get(":id/design")
  async getDesign(@Param("id") id: string, @Res() response: Response) {
    const result = await this.deviceTypesService.getDesignFile(id);

    if (!result) {
      throw new NotFoundException({
        error: {
          code: "DEVICE_TYPE_DESIGN_NOT_FOUND",
          message: "Device type design not found"
        }
      });
    }

    response.setHeader("Content-Type", result.contentType);
    return response.send(result.file);
  }

  @Post()
  create(@Body() dto: CreateDeviceTypeDto) {
    return this.deviceTypesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDeviceTypeDto) {
    return this.deviceTypesService.update(id, dto);
  }

  @Post(":id/design")
  uploadDesign(@Param("id") id: string, @Body() dto: UploadDeviceTypeDesignDto) {
    return this.deviceTypesService.uploadDesign(id, dto);
  }
}
