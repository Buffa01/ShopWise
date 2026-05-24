import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { badRequest, conflict } from "../../common/errors/http-errors";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../assets/storage.service";
import type { CreateDeviceTypeDto } from "./dto/create-device-type.dto";
import type { UpdateDeviceTypeDto } from "./dto/update-device-type.dto";
import type { UploadDeviceTypeDesignDto } from "./dto/upload-device-type-design.dto";

@Injectable()
export class DeviceTypesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService
  ) {}

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

  async uploadDesign(id: string, dto: UploadDeviceTypeDesignDto) {
    await this.get(id);

    const buffer = this.parseDataUrl(dto);
    this.validateDesignImage(dto.contentType, buffer);
    const extension = dto.contentType === "image/png" ? "png" : "jpg";
    const key = `device-types/${id}/base-design.${extension}`;

    await this.storage.write(key, buffer);

    return this.prisma.deviceType.update({
      where: { id },
      data: {
        baseDesignKey: key
      }
    });
  }

  async getDesignFile(id: string) {
    const deviceType = await this.get(id);

    if (!deviceType.baseDesignKey) {
      return null;
    }

    const contentType = deviceType.baseDesignKey.endsWith(".png") ? "image/png" : "image/jpeg";

    return {
      contentType,
      file: await this.storage.read(deviceType.baseDesignKey)
    };
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

  private parseDataUrl(dto: UploadDeviceTypeDesignDto) {
    const expectedPrefix = `data:${dto.contentType};base64,`;

    if (!dto.dataUrl.startsWith(expectedPrefix)) {
      throw badRequest("VALIDATION_ERROR", "Invalid design image data URL");
    }

    return Buffer.from(dto.dataUrl.slice(expectedPrefix.length), "base64");
  }

  private validateDesignImage(contentType: UploadDeviceTypeDesignDto["contentType"], buffer: Buffer) {
    if (contentType !== "image/png") {
      return;
    }

    if (buffer.length < 26 || buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
      throw badRequest("VALIDATION_ERROR", "Invalid PNG design image");
    }
  }
}
