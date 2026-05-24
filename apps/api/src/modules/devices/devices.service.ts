import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AssignmentStatus, BatchStatus, DeviceEventType, OperationalStatus, Prisma } from "@prisma/client";
import { AssetsService } from "../assets/assets.service";
import { badRequest, forbidden } from "../../common/errors/http-errors";
import { PrismaService } from "../../prisma/prisma.service";
import { CodeGeneratorService } from "./code/code-generator.service";
import type { UpdateAdminDeviceDto } from "./dto/update-admin-device.dto";
import type { CreateDeviceBatchDto } from "./dto/create-device-batch.dto";
import type { CreateDeviceDto } from "./dto/create-device.dto";
import type { ClaimDeviceDto } from "./dto/claim-device.dto";
import type { ListDevicesQueryDto } from "./dto/list-devices-query.dto";
import type { UpdateClientDeviceDto } from "./dto/update-client-device.dto";

const DEVICE_INCLUDE = {
  deviceType: true,
  business: {
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  },
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
    if (query.businessId) where.businessId = query.businessId;
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

  getBatchPrintSheetFile(batchId: string) {
    return this.assets.generateBatchPrintSheet(batchId);
  }

  async updateAdminDevice(id: string, dto: UpdateAdminDeviceDto, actorUserId: string) {
    const device = await this.get(id);
    const data: Prisma.DeviceUpdateInput = {};
    const nextTargetUrl = dto.targetUrl !== undefined ? dto.targetUrl.trim() || null : device.targetUrl;
    const nextAlias = dto.alias !== undefined ? dto.alias.trim() || null : device.alias;
    const nextProductionStatus = dto.productionStatus ?? device.productionStatus;
    let nextOperationalStatus = dto.operationalStatus ?? device.operationalStatus;

    if (dto.alias !== undefined) {
      data.alias = nextAlias;
    }

    if (dto.targetUrl !== undefined) {
      data.targetUrl = nextTargetUrl;
    }

    if (dto.productionStatus !== undefined) {
      data.productionStatus = dto.productionStatus;
    }

    if (dto.operationalStatus !== undefined) {
      if (dto.operationalStatus === OperationalStatus.ACTIVE && !nextTargetUrl) {
        throw badRequest("VALIDATION_ERROR", "Active devices require a target URL");
      }

      data.operationalStatus = dto.operationalStatus;
    } else if (dto.targetUrl !== undefined && !nextTargetUrl && device.operationalStatus === OperationalStatus.ACTIVE) {
      data.operationalStatus = OperationalStatus.INACTIVE;
      nextOperationalStatus = OperationalStatus.INACTIVE;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: device.id },
        data
      });

      await this.recordAdminDeviceChange(tx, actorUserId, device.id, "ADMIN_DEVICE_UPDATE", device, {
        alias: nextAlias,
        targetUrl: nextTargetUrl,
        productionStatus: nextProductionStatus,
        operationalStatus: nextOperationalStatus,
        businessId: device.businessId,
        assignmentStatus: device.assignmentStatus
      });

      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: dto.operationalStatus || dto.productionStatus ? DeviceEventType.STATUS_CHANGE : DeviceEventType.CONFIG_UPDATE,
          source: "SYSTEM",
          metadata: {
            actorUserId,
            fields: Object.keys(dto)
          }
        }
      });
    });

    return this.get(device.id);
  }

  async assignAdminDevice(id: string, businessId: string, actorUserId: string) {
    const [device, business] = await Promise.all([
      this.get(id),
      this.prisma.business.findUnique({
        where: { id: businessId }
      })
    ]);

    if (!business) {
      throw badRequest("BUSINESS_NOT_FOUND", "Client business not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: device.id },
        data: {
          businessId: business.id,
          assignmentStatus: AssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
          operationalStatus: device.targetUrl ? device.operationalStatus : OperationalStatus.INACTIVE
        }
      });

      await this.recordAdminDeviceChange(tx, actorUserId, device.id, "ADMIN_DEVICE_ASSIGN", device, {
        alias: device.alias,
        targetUrl: device.targetUrl,
        productionStatus: device.productionStatus,
        operationalStatus: device.targetUrl ? device.operationalStatus : OperationalStatus.INACTIVE,
        businessId: business.id,
        assignmentStatus: AssignmentStatus.ASSIGNED
      });

      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: DeviceEventType.CONFIG_UPDATE,
          source: "SYSTEM",
          metadata: {
            actorUserId,
            businessId: business.id,
            action: "ADMIN_ASSIGN"
          }
        }
      });
    });

    return this.get(device.id);
  }

  async unassignAdminDevice(id: string, actorUserId: string) {
    const device = await this.get(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: device.id },
        data: {
          alias: null,
          targetUrl: null,
          businessId: null,
          assignmentStatus: AssignmentStatus.UNASSIGNED,
          operationalStatus: OperationalStatus.INACTIVE,
          assignedAt: null
        }
      });

      await this.recordAdminDeviceChange(tx, actorUserId, device.id, "ADMIN_DEVICE_UNASSIGN", device, {
        alias: null,
        targetUrl: null,
        productionStatus: device.productionStatus,
        operationalStatus: OperationalStatus.INACTIVE,
        businessId: null,
        assignmentStatus: AssignmentStatus.UNASSIGNED
      });

      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: DeviceEventType.CONFIG_UPDATE,
          source: "SYSTEM",
          metadata: {
            actorUserId,
            action: "ADMIN_UNASSIGN"
          }
        }
      });
    });

    return this.get(device.id);
  }

  listClientDevices(userId: string) {
    return this.prisma.device.findMany({
      where: {
        business: {
          ownerUserId: userId
        }
      },
      include: DEVICE_INCLUDE,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async getClientDevice(id: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id,
        business: {
          ownerUserId: userId
        }
      },
      include: {
        ...DEVICE_INCLUDE,
        events: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!device) {
      throw forbidden("DEVICE_FORBIDDEN", "Device not found or not owned by this client");
    }

    return device;
  }

  async claim(dto: ClaimDeviceDto, userId: string) {
    const code = dto.code.trim().toUpperCase();
    const business = await this.prisma.business.findUnique({
      where: { ownerUserId: userId }
    });

    if (!business) {
      throw badRequest("VALIDATION_ERROR", "Client business profile not found");
    }

    const device = await this.prisma.device.findUnique({
      where: { publicCode: code }
    });

    if (!device) {
      throw badRequest("DEVICE_NOT_FOUND", "Device not found");
    }

    if (device.assignmentStatus === AssignmentStatus.ASSIGNED || device.businessId) {
      throw badRequest("DEVICE_ALREADY_ASSIGNED", "Device already has an owner");
    }

    if (device.operationalStatus === OperationalStatus.DISABLED || device.operationalStatus === OperationalStatus.ARCHIVED) {
      throw badRequest("DEVICE_NOT_CLAIMABLE", "Device cannot be claimed");
    }

    const claimed = await this.prisma.device.updateMany({
      where: {
        id: device.id,
        businessId: null,
        assignmentStatus: AssignmentStatus.UNASSIGNED
      },
      data: {
        businessId: business.id,
        assignmentStatus: AssignmentStatus.ASSIGNED,
        operationalStatus: device.targetUrl ? OperationalStatus.ACTIVE : OperationalStatus.INACTIVE,
        assignedAt: new Date()
      }
    });

    if (claimed.count !== 1) {
      throw badRequest("DEVICE_ALREADY_ASSIGNED", "Device already has an owner");
    }

    await this.prisma.deviceEvent.create({
      data: {
        deviceId: device.id,
        eventType: DeviceEventType.CLAIM,
        source: "SYSTEM",
        metadata: {
          businessId: business.id,
          userId
        }
      }
    });

    return this.getClientDevice(device.id, userId);
  }

  async updateClientDevice(id: string, userId: string, dto: UpdateClientDeviceDto) {
    const device = await this.getClientDevice(id, userId);
    const data: Prisma.DeviceUpdateInput = {};
    const nextTargetUrl = dto.targetUrl !== undefined ? dto.targetUrl.trim() || null : device.targetUrl;

    if (dto.alias !== undefined) {
      data.alias = dto.alias.trim() || null;
    }

    if (dto.targetUrl !== undefined) {
      data.targetUrl = nextTargetUrl;
    }

    if (dto.operationalStatus !== undefined) {
      if (![OperationalStatus.ACTIVE, OperationalStatus.PAUSED, OperationalStatus.INACTIVE].includes(dto.operationalStatus)) {
        throw badRequest("VALIDATION_ERROR", "Clients can only set active, paused, or inactive status");
      }

      if (dto.operationalStatus === OperationalStatus.ACTIVE && !nextTargetUrl) {
        throw badRequest("VALIDATION_ERROR", "Active devices require a target URL");
      }

      data.operationalStatus = dto.operationalStatus;
    } else if (nextTargetUrl && device.operationalStatus === OperationalStatus.INACTIVE) {
      data.operationalStatus = OperationalStatus.ACTIVE;
    } else if (dto.targetUrl !== undefined && !nextTargetUrl && device.operationalStatus === OperationalStatus.ACTIVE) {
      data.operationalStatus = OperationalStatus.INACTIVE;
    }

    await this.prisma.device.update({
      where: { id: device.id },
      data
    });

    await this.prisma.deviceEvent.create({
      data: {
        deviceId: device.id,
        eventType: DeviceEventType.CONFIG_UPDATE,
        source: "SYSTEM",
        metadata: {
          fields: Object.keys(dto)
        }
      }
    });

    return this.getClientDevice(device.id, userId);
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

  private recordAdminDeviceChange(
    tx: Prisma.TransactionClient,
    actorUserId: string,
    deviceId: string,
    action: string,
    beforeDevice: {
      alias: string | null;
      targetUrl: string | null;
      productionStatus: string;
      operationalStatus: string;
      businessId: string | null;
      assignmentStatus: string;
    },
    afterDevice: {
      alias: string | null;
      targetUrl: string | null;
      productionStatus: string;
      operationalStatus: string;
      businessId: string | null;
      assignmentStatus: string;
    }
  ) {
    return tx.auditLog.create({
      data: {
        actorUserId,
        businessId: typeof afterDevice.businessId === "string" ? afterDevice.businessId : beforeDevice.businessId,
        deviceId,
        action,
        before: {
          alias: beforeDevice.alias,
          targetUrl: beforeDevice.targetUrl,
          productionStatus: beforeDevice.productionStatus,
          operationalStatus: beforeDevice.operationalStatus,
          businessId: beforeDevice.businessId,
          assignmentStatus: beforeDevice.assignmentStatus
        },
        after: {
          alias: afterDevice.alias,
          targetUrl: afterDevice.targetUrl,
          productionStatus: afterDevice.productionStatus,
          operationalStatus: afterDevice.operationalStatus,
          businessId: afterDevice.businessId,
          assignmentStatus: afterDevice.assignmentStatus
        }
      }
    });
  }
}
