import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BatchStatus, Prisma } from "@prisma/client";
import { AssetsService } from "../assets/assets.service";
import { badRequest } from "../../common/errors/http-errors";
import { PrismaService } from "../../prisma/prisma.service";
import { CodeGeneratorService } from "./code/code-generator.service";
import type { CreateDeviceBatchDto } from "./dto/create-device-batch.dto";
import type { CreateDeviceDto } from "./dto/create-device.dto";
import type { ListDevicesQueryDto } from "./dto/list-devices-query.dto";

const DEVICE_INCLUDE = {
  deviceType: true,
  business: true,
  batch: true
} satisfies Prisma.DeviceInclude;

@Injectable()
export class DevicesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CodeGeneratorService) private readonly codeGenerator: CodeGeneratorService,
    @Inject(AssetsService) private readonly assets: AssetsService
  ) {}

  list(query: ListDevicesQueryDto) {
    const where: Prisma.DeviceWhereInput = {};

    if (query.deviceTypeId) where.deviceTypeId = query.deviceTypeId;
    if (query.productionStatus) where.productionStatus = query.productionStatus;
    if (query.assignmentStatus) where.assignmentStatus = query.assignmentStatus;
    if (query.operationalStatus) where.operationalStatus = query.operationalStatus;

    if (query.q) {
      where.OR = [
        { publicCode: { contains: query.q, mode: "insensitive" } },
        { alias: { contains: query.q, mode: "insensitive" } },
        { targetUrl: { contains: query.q, mode: "insensitive" } },
        { deviceType: { name: { contains: query.q, mode: "insensitive" } } },
        { business: { businessName: { contains: query.q, mode: "insensitive" } } }
      ];
    }

    return this.prisma.device.findMany({
      where,
      include: DEVICE_INCLUDE,
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });
  }

  async get(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        ...DEVICE_INCLUDE,
        events: {
          orderBy: { createdAt: "desc" },
          take: 10
        },
        printAssets: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    if (!device) {
      throw new NotFoundException({
        error: {
          code: "DEVICE_NOT_FOUND",
          message: "Device not found"
        }
      });
    }

    return device;
  }

  async createOne(dto: CreateDeviceDto) {
    const device = await this.prisma.$transaction(async (tx) => {
      const deviceType = await this.getActiveDeviceType(dto.deviceTypeId, tx);
      const prefix = this.resolvePrefix(dto.prefix, deviceType.defaultPrefix);
      const [publicCode] = await this.codeGenerator.allocateCodes(prefix, 1, tx);

      return tx.device.create({
        data: this.buildDeviceCreateData(deviceType.id, publicCode),
        include: DEVICE_INCLUDE
      });
    });

    await this.assets.generateDeviceAssets(device.id);
    return this.get(device.id);
  }

  async createBatch(dto: CreateDeviceBatchDto, createdById: string) {
    const batch = await this.prisma.$transaction(async (tx) => {
      const deviceType = await this.getActiveDeviceType(dto.deviceTypeId, tx);
      const prefix = this.resolvePrefix(dto.prefix, deviceType.defaultPrefix);
      const publicCodes = await this.codeGenerator.allocateCodes(prefix, dto.quantity, tx);

      const batch = await tx.deviceBatch.create({
        data: {
          quantity: dto.quantity,
          prefix,
          status: BatchStatus.GENERATING,
          createdById
        }
      });

      await tx.device.createMany({
        data: publicCodes.map((publicCode) => ({
          ...this.buildDeviceCreateData(deviceType.id, publicCode),
          batchId: batch.id
        }))
      });

      await tx.deviceBatch.update({
        where: { id: batch.id },
        data: { status: BatchStatus.COMPLETED }
      });

      return tx.deviceBatch.findUniqueOrThrow({
        where: { id: batch.id },
        include: {
          devices: {
            orderBy: { publicCode: "asc" },
            include: DEVICE_INCLUDE
          }
        }
      });
    });

    for (const device of batch.devices) {
      await this.assets.generateDeviceAssets(device.id);
    }

    return this.prisma.deviceBatch.findUniqueOrThrow({
      where: { id: batch.id },
      include: {
        devices: {
          orderBy: { publicCode: "asc" },
          include: DEVICE_INCLUDE
        }
      }
    });
  }

  getLatestPrintAssetFile(deviceId: string) {
    return this.assets.getLatestPrintAssetFile(deviceId);
  }

  private async getActiveDeviceType(id: string, tx: Prisma.TransactionClient) {
    const deviceType = await tx.deviceType.findUnique({
      where: { id }
    });

    if (!deviceType || !deviceType.isActive) {
      throw badRequest("DEVICE_TYPE_NOT_FOUND", "Active device type not found");
    }

    return deviceType;
  }

  private resolvePrefix(requestPrefix: string | undefined, deviceTypePrefix: string | null) {
    const prefix = (requestPrefix || deviceTypePrefix || "A").trim().toUpperCase();

    if (!/^[A-Z0-9]+$/.test(prefix)) {
      throw badRequest("VALIDATION_ERROR", "Prefix must contain only uppercase letters and numbers");
    }

    return prefix;
  }

  private buildDeviceCreateData(deviceTypeId: string, publicCode: string) {
    const links = this.codeGenerator.buildLinks(publicCode);

    return {
      deviceTypeId,
      publicCode,
      ...links
    };
  }
}
