import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { Response } from "express";
import { CurrentUserDecorator } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { CurrentUser } from "../../common/types/authenticated-request";
import { AssignDeviceDto } from "./dto/assign-device.dto";
import { CleanupExpiredAssetsDto } from "./dto/cleanup-expired-assets.dto";
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

  @Get("production")
  listProduction() {
    return this.devicesService.listProduction();
  }

  @Post("assets/cleanup-expired")
  cleanupExpiredAssets(@Body() dto: CleanupExpiredAssetsDto, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.cleanupExpiredAssets(dto.retentionDays, currentUser.id);
  }

  @Post("batches/:batchId/mark-printed")
  markBatchPrinted(@Param("batchId") batchId: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.markBatchPrinted(batchId, currentUser.id);
  }

  @Post("batches/:batchId/mark-downloaded")
  markBatchDownloaded(@Param("batchId") batchId: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.markBatchDownloaded(batchId, currentUser.id);
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

  @Post(":id/assets/mark-downloaded")
  markAssetDownloaded(@Param("id") id: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.markDeviceAssetDownloaded(id, currentUser.id);
  }

  @Post(":id/assets/regenerate")
  regenerateAsset(@Param("id") id: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.regenerateDeviceAssets(id, currentUser.id);
  }

  @Post(":id/assets/delete")
  deleteAssetFiles(@Param("id") id: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.deleteDeviceAssetFiles(id, currentUser.id);
  }

  @Post(":id/mark-printed")
  markPrinted(@Param("id") id: string, @CurrentUserDecorator() currentUser: CurrentUser) {
    return this.devicesService.markDevicePrinted(id, currentUser.id);
  }

  @Get("batches/:batchId/assets/sheet")
  async downloadBatchPrintSheet(@Param("batchId") batchId: string, @Res() response: Response) {
    const result = await this.devicesService.getBatchPrintSheetFile(batchId);

    if (!result) {
      throw new NotFoundException({
        error: {
          code: "BATCH_PRINT_SHEET_NOT_FOUND",
          message: "Batch print sheet not found"
        }
      });
    }

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename=\"batch-${result.batch.id}-sheet.pdf\"`);
    response.setHeader("X-ShopWise-Sheet-Columns", String(result.columns));
    response.setHeader("X-ShopWise-Sheet-Rows", String(result.rows));
    response.setHeader("X-ShopWise-Sheet-Width-Mm", String(result.widthMm));
    response.setHeader("X-ShopWise-Sheet-Height-Mm", String(Math.round(result.heightMm * 10) / 10));
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
