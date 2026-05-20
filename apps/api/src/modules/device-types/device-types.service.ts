import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { conflict } from "../../common/errors/http-errors";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateDeviceTypeDto } from "./dto/create-device-type.dto";
import type { UpdateDeviceTypeDto } from "./dto/update-device-type.dto";

@Injectable()
export class DeviceTypesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.deviceType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            devices: true
          }
        }
      }
    });
  }

  async get(id: string) {
    const deviceType = await this.prisma.deviceType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            devices: true
          }
        }
      }
    });

    if (!deviceType) {
      throw new NotFoundException({
        error: {
          code: "DEVICE_TYPE_NOT_FOUND",
          message: "Device type not found"
        }
      });
    }

    return deviceType;
  }

  async create(dto: CreateDeviceTypeDto) {
    try {
      return await this.prisma.deviceType.create({
        data: this.toCreateData(dto)
      });
    } catch (error) {
      this.handleUniqueSlug(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateDeviceTypeDto) {
    await this.get(id);

    try {
      return await this.prisma.deviceType.update({
        where: { id },
        data: this.toUpdateData(dto)
      });
    } catch (error) {
      this.handleUniqueSlug(error);
      throw error;
    }
  }

  private toCreateData(dto: CreateDeviceTypeDto): Prisma.DeviceTypeCreateInput {
    return {
      name: dto.name.trim(),
      slug: dto.slug.trim(),
      description: dto.description?.trim() || null,
      isActive: dto.isActive ?? true,
      defaultPrefix: dto.defaultPrefix?.trim() || null,
      templateKey: dto.templateKey?.trim() || null,
      baseDesignKey: dto.baseDesignKey?.trim() || null,
      qrPosition: dto.qrPosition ? (dto.qrPosition as Prisma.InputJsonObject) : Prisma.JsonNull
    };
  }

  private toUpdateData(dto: UpdateDeviceTypeDto): Prisma.DeviceTypeUpdateInput {
    const data: Prisma.DeviceTypeUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = dto.slug.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.defaultPrefix !== undefined) data.defaultPrefix = dto.defaultPrefix.trim() || null;
    if (dto.templateKey !== undefined) data.templateKey = dto.templateKey.trim() || null;
    if (dto.baseDesignKey !== undefined) data.baseDesignKey = dto.baseDesignKey.trim() || null;
    if (dto.qrPosition !== undefined) data.qrPosition = dto.qrPosition as Prisma.InputJsonObject;

    return data;
  }

  private handleUniqueSlug(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("DEVICE_TYPE_SLUG_EXISTS", "A device type with this slug already exists");
    }
  }
}
