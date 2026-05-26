import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AssignmentStatus, BatchStatus, DeviceEventType, OperationalStatus, Prisma, ProductionStatus } from "@prisma/client";
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

const DEFAULT_ASSET_RETENTION_DAYS = 60;

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

  async listProduction() {
    const [singleDevices, batches, usage] = await Promise.all([
      this.prisma.device.findMany({
        where: {
          batchId: null
        },
        include: {
          ...DEVICE_INCLUDE,
          printAssets: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 100
      }),
      this.prisma.deviceBatch.findMany({
        include: {
          devices: {
            orderBy: { publicCode: "asc" },
            include: {
              ...DEVICE_INCLUDE,
              printAssets: {
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      }),
      this.assets.getStorageUsage()
    ]);

    const storageObjects = await this.prisma.storageObject.findMany({
      where: {
        key: {
          in: this.collectProductionAssetKeys(singleDevices, batches)
        }
      },
      select: {
        byteSize: true,
        key: true
      }
    });
    const storageByKey = new Map(storageObjects.map((object) => [object.key, object.byteSize]));
    const singleItems = singleDevices.map((device) => this.toProductionDeviceItem(device, storageByKey));
    const batchItems = batches.map((batch) => this.toProductionBatchItem(batch, storageByKey));
    const allDeviceItems = [
      ...singleItems,
      ...batchItems.flatMap((batch) => batch.devices)
    ];

    return {
      summary: {
        totalItems: singleItems.length + batchItems.length,
        singleDevices: singleItems.length,
        batches: batchItems.length,
        totalDevices: allDeviceItems.length,
        generatedDevices: allDeviceItems.filter((device) => device.hasAsset).length,
        downloadedDevices: allDeviceItems.filter((device) => device.productionStatus === ProductionStatus.DOWNLOADED).length,
        printedDevices: allDeviceItems.filter((device) => device.productionStatus === ProductionStatus.PRINTED).length,
        configuredDevices: allDeviceItems.filter((device) => device.isConfigured).length
      },
      storage: {
        usedBytes: usage.usedBytes.toString(),
        totalLimitBytes: usage.totalLimitBytes.toString(),
        maxObjectBytes: usage.maxObjectBytes.toString(),
        retentionDays: DEFAULT_ASSET_RETENTION_DAYS
      },
      singles: singleItems,
      batches: batchItems
    };
  }

  async markDeviceAssetDownloaded(id: string, actorUserId: string) {
    return this.setDeviceProductionStatus(id, ProductionStatus.DOWNLOADED, actorUserId, "ADMIN_DEVICE_ASSET_DOWNLOADED");
  }

  async markDevicePrinted(id: string, actorUserId: string) {
    return this.setDeviceProductionStatus(id, ProductionStatus.PRINTED, actorUserId, "ADMIN_DEVICE_PRINTED");
  }

  async markBatchPrinted(batchId: string, actorUserId: string) {
    return this.setBatchProductionStatus(batchId, ProductionStatus.PRINTED, actorUserId, "ADMIN_BATCH_PRINTED");
  }

  async markBatchDownloaded(batchId: string, actorUserId: string) {
    return this.setBatchProductionStatus(batchId, ProductionStatus.DOWNLOADED, actorUserId, "ADMIN_BATCH_DOWNLOADED");
  }

  async regenerateDeviceAssets(id: string, actorUserId: string) {
    const device = await this.get(id);
    const asset = await this.assets.regenerateDeviceAssets(device.id);

    await this.prisma.deviceEvent.create({
      data: {
        deviceId: device.id,
        eventType: DeviceEventType.ASSET_GENERATED,
        source: "SYSTEM",
        metadata: {
          actorUserId,
          action: "ADMIN_REGENERATE_ASSET",
          assetId: asset.id
        }
      }
    });

    return this.get(id);
  }

  async deleteDeviceAssetFiles(id: string, actorUserId: string) {
    const device = await this.get(id);
    const result = await this.assets.deleteDeviceAssetFiles(device.id);

    await this.prisma.$transaction(async (tx) => {
      await this.recordAdminDeviceChange(tx, actorUserId, device.id, "ADMIN_DEVICE_ASSET_DELETE", device, {
        alias: device.alias,
        targetUrl: device.targetUrl,
        productionStatus: ProductionStatus.CREATED,
        operationalStatus: device.operationalStatus,
        businessId: device.businessId,
        assignmentStatus: device.assignmentStatus
      });

      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: DeviceEventType.STATUS_CHANGE,
          source: "SYSTEM",
          metadata: {
            actorUserId,
            action: "ADMIN_DELETE_ASSET_FILES",
            deletedKeys: result.deletedKeys
          }
        }
      });
    });

    return this.get(id);
  }

  async cleanupExpiredAssets(retentionDays = DEFAULT_ASSET_RETENTION_DAYS, actorUserId: string) {
    const result = await this.assets.cleanupExpiredAssets(retentionDays);

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action: "ADMIN_EXPIRED_ASSETS_CLEANUP",
        before: {
          retentionDays
        },
        after: {
          deletedAssets: result.deletedAssets,
          deletedKeys: result.deletedKeys.length,
          cutoff: result.cutoff.toISOString()
        }
      }
    });

    return this.listProduction();
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

  async listClientDevices(userId: string) {
    const devices = await this.prisma.device.findMany({
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

    return devices.map((device) => this.toClientDevice(device));
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

    return this.toClientDevice(device);
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

  private async setDeviceProductionStatus(
    id: string,
    productionStatus: ProductionStatus,
    actorUserId: string,
    action: string
  ) {
    const device = await this.get(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: device.id },
        data: {
          productionStatus
        }
      });

      await this.recordAdminDeviceChange(tx, actorUserId, device.id, action, device, {
        alias: device.alias,
        targetUrl: device.targetUrl,
        productionStatus,
        operationalStatus: device.operationalStatus,
        businessId: device.businessId,
        assignmentStatus: device.assignmentStatus
      });

      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: productionStatus === ProductionStatus.DOWNLOADED ? DeviceEventType.ASSET_DOWNLOADED : DeviceEventType.STATUS_CHANGE,
          source: "SYSTEM",
          metadata: {
            actorUserId,
            action
          }
        }
      });
    });

    return this.get(device.id);
  }

  private async setBatchProductionStatus(
    batchId: string,
    productionStatus: ProductionStatus,
    actorUserId: string,
    action: string
  ) {
    const batch = await this.prisma.deviceBatch.findUnique({
      where: { id: batchId },
      include: {
        devices: true
      }
    });

    if (!batch) {
      throw new NotFoundException({
        error: {
          code: "BATCH_NOT_FOUND",
          message: "Batch not found"
        }
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.device.updateMany({
        where: { batchId },
        data: {
          productionStatus
        }
      });

      await Promise.all(
        batch.devices.map((device) =>
          tx.deviceEvent.create({
            data: {
              deviceId: device.id,
              eventType: productionStatus === ProductionStatus.DOWNLOADED ? DeviceEventType.ASSET_DOWNLOADED : DeviceEventType.STATUS_CHANGE,
              source: "SYSTEM",
              metadata: {
                actorUserId,
                action,
                batchId
              }
            }
          })
        )
      );
    });

    return this.listProduction();
  }

  private collectProductionAssetKeys(
    singleDevices: Array<
      Prisma.DeviceGetPayload<{
        include: typeof DEVICE_INCLUDE & {
          printAssets: {
            orderBy: { createdAt: "desc" };
            take: 1;
          };
        };
      }>
    >,
    batches: Array<
      Prisma.DeviceBatchGetPayload<{
        include: {
          devices: {
            orderBy: { publicCode: "asc" };
            include: typeof DEVICE_INCLUDE & {
              printAssets: {
                orderBy: { createdAt: "desc" };
                take: 1;
              };
            };
          };
        };
      }>
    >
  ) {
    const keys = new Set<string>();
    const addDeviceKeys = (device: (typeof singleDevices)[number]) => {
      const latestAsset = device.printAssets[0] ?? null;

      if (device.qrImageKey) keys.add(device.qrImageKey);
      if (latestAsset?.pdfKey) keys.add(latestAsset.pdfKey);
      if (latestAsset?.pngKey) keys.add(latestAsset.pngKey);
      if (latestAsset?.svgKey) keys.add(latestAsset.svgKey);
    };

    singleDevices.forEach(addDeviceKeys);
    batches.forEach((batch) => batch.devices.forEach(addDeviceKeys));

    return Array.from(keys);
  }

  private toProductionDeviceItem(
    device: Prisma.DeviceGetPayload<{
      include: typeof DEVICE_INCLUDE & {
        printAssets: {
          orderBy: { createdAt: "desc" };
          take: 1;
        };
      };
    }>,
    storageByKey: Map<string, bigint>
  ) {
    const latestAsset = device.printAssets[0] ?? null;
    const assetBytes = [
      latestAsset?.pdfKey ? storageByKey.get(latestAsset.pdfKey) ?? 0n : 0n,
      latestAsset?.pngKey ? storageByKey.get(latestAsset.pngKey) ?? 0n : 0n,
      latestAsset?.svgKey ? storageByKey.get(latestAsset.svgKey) ?? 0n : 0n,
      device.qrImageKey ? storageByKey.get(device.qrImageKey) ?? 0n : 0n
    ];
    const totalBytes = assetBytes.reduce((sum, value) => sum + value, 0n);

    return {
      id: device.id,
      publicCode: device.publicCode,
      deviceTypeName: device.deviceType.name,
      businessName: device.business?.businessName ?? null,
      batchId: device.batchId,
      productionStatus: device.productionStatus,
      assignmentStatus: device.assignmentStatus,
      operationalStatus: device.operationalStatus,
      isConfigured: Boolean(device.businessId && device.targetUrl),
      hasAsset: Boolean(latestAsset?.pdfKey || latestAsset?.pngKey || latestAsset?.svgKey || device.qrImageKey),
      latestAsset: latestAsset
        ? {
            id: latestAsset.id,
            pdfKey: latestAsset.pdfKey,
            pdfBytes: latestAsset.pdfKey ? (storageByKey.get(latestAsset.pdfKey) ?? 0n).toString() : null,
            pngKey: latestAsset.pngKey,
            pngBytes: latestAsset.pngKey ? (storageByKey.get(latestAsset.pngKey) ?? 0n).toString() : null,
            svgKey: latestAsset.svgKey,
            svgBytes: latestAsset.svgKey ? (storageByKey.get(latestAsset.svgKey) ?? 0n).toString() : null,
            qrImageKey: device.qrImageKey,
            qrImageBytes: device.qrImageKey ? (storageByKey.get(device.qrImageKey) ?? 0n).toString() : null,
            totalBytes: totalBytes.toString(),
            createdAt: latestAsset.createdAt
          }
        : null,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt
    };
  }

  private toProductionBatchItem(
    batch: Prisma.DeviceBatchGetPayload<{
      include: {
        devices: {
          orderBy: { publicCode: "asc" };
          include: typeof DEVICE_INCLUDE & {
            printAssets: {
              orderBy: { createdAt: "desc" };
              take: 1;
            };
          };
        };
      };
    }>,
    storageByKey: Map<string, bigint>
  ) {
    const devices = batch.devices.map((device) => this.toProductionDeviceItem(device, storageByKey));
    const generated = devices.filter((device) => device.hasAsset).length;
    const downloaded = devices.filter((device) => device.productionStatus === ProductionStatus.DOWNLOADED).length;
    const printed = devices.filter((device) => device.productionStatus === ProductionStatus.PRINTED).length;
    const configured = devices.filter((device) => device.isConfigured).length;

    return {
      id: batch.id,
      prefix: batch.prefix,
      quantity: batch.quantity,
      status: batch.status,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      counts: {
        total: devices.length,
        generated,
        downloaded,
        printed,
        configured
      },
      devices
    };
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

  private toClientDevice<T extends object>(device: T) {
    const sanitized = { ...device } as Record<string, unknown>;
    delete sanitized.qrPath;
    delete sanitized.nfcPath;
    delete sanitized.qrUrl;
    delete sanitized.nfcUrl;
    delete sanitized.qrImageKey;
    delete sanitized.latestPrintAssetId;
    delete sanitized.printAssets;
    delete sanitized.batch;

    return sanitized as Omit<
      T,
      "qrPath" | "nfcPath" | "qrUrl" | "nfcUrl" | "qrImageKey" | "latestPrintAssetId" | "printAssets" | "batch"
    >;
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
