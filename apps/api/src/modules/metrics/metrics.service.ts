import { Inject, Injectable } from "@nestjs/common";
import { DeviceEventType, Prisma } from "@prisma/client";
import { badRequest } from "../../common/errors/http-errors";
import { PrismaService } from "../../prisma/prisma.service";

const SCAN_EVENT_TYPES = [DeviceEventType.QR_SCAN, DeviceEventType.NFC_TAP] as const;
const DEFAULT_DAYS = 30;

@Injectable()
export class MetricsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getAdminOverview() {
    const scanWhere = this.buildScanWhere();
    const [deviceCounts, totalScans, qrScans, nfcTaps, redirects, scansByDay, topDevices, topClients] = await Promise.all([
      this.getDeviceCounts(),
      this.prisma.deviceEvent.count({ where: scanWhere }),
      this.prisma.deviceEvent.count({ where: { eventType: DeviceEventType.QR_SCAN } }),
      this.prisma.deviceEvent.count({ where: { eventType: DeviceEventType.NFC_TAP } }),
      this.prisma.deviceEvent.count({ where: { eventType: DeviceEventType.REDIRECT } }),
      this.getScansByDay(scanWhere),
      this.getTopDevices(scanWhere),
      this.getTopClients(scanWhere)
    ]);

    return {
      ...deviceCounts,
      totalScans,
      qrScans,
      nfcTaps,
      redirects,
      scansByDay,
      topDevices,
      topClients
    };
  }

  async getClientOverview(userId: string) {
    const deviceScope: Prisma.DeviceWhereInput = {
      business: {
        ownerUserId: userId
      }
    };
    const scanWhere = this.buildScanWhere(deviceScope);

    const [deviceCounts, totalScans, qrScans, nfcTaps, redirects, scansByDay, topDevices, latestEvents] = await Promise.all([
      this.getDeviceCounts(deviceScope),
      this.prisma.deviceEvent.count({ where: scanWhere }),
      this.prisma.deviceEvent.count({ where: { ...scanWhere, eventType: DeviceEventType.QR_SCAN } }),
      this.prisma.deviceEvent.count({ where: { ...scanWhere, eventType: DeviceEventType.NFC_TAP } }),
      this.prisma.deviceEvent.count({ where: { eventType: DeviceEventType.REDIRECT, device: deviceScope } }),
      this.getScansByDay(scanWhere),
      this.getTopDevices(scanWhere),
      this.getLatestEvents({ device: deviceScope })
    ]);

    return {
      ...deviceCounts,
      totalScans,
      qrScans,
      nfcTaps,
      redirects,
      scansByDay,
      topDevices,
      latestEvents
    };
  }

  async getAdminDeviceMetrics(deviceId: string) {
    await this.ensureDeviceExists(deviceId);
    return this.getDeviceMetrics(deviceId);
  }

  async getClientDeviceMetrics(deviceId: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        business: {
          ownerUserId: userId
        }
      },
      select: { id: true }
    });

    if (!device) {
      throw badRequest("DEVICE_FORBIDDEN", "Device not found or not owned by this client");
    }

    return this.getDeviceMetrics(deviceId);
  }

  private async getDeviceMetrics(deviceId: string) {
    const scanWhere = this.buildScanWhere({ id: deviceId });
    const [totalScans, qrScans, nfcTaps, redirects, scansByDay, latestEvents] = await Promise.all([
      this.prisma.deviceEvent.count({ where: scanWhere }),
      this.prisma.deviceEvent.count({ where: { eventType: DeviceEventType.QR_SCAN, deviceId } }),
      this.prisma.deviceEvent.count({ where: { eventType: DeviceEventType.NFC_TAP, deviceId } }),
      this.prisma.deviceEvent.count({ where: { eventType: DeviceEventType.REDIRECT, deviceId } }),
      this.getScansByDay(scanWhere),
      this.getLatestEvents({ deviceId })
    ]);

    return {
      totalScans,
      qrScans,
      nfcTaps,
      redirects,
      scansByDay,
      latestEvents
    };
  }

  private async getDeviceCounts(where: Prisma.DeviceWhereInput = {}) {
    const [totalDevices, activeDevices, assignedDevices, unassignedDevices] = await Promise.all([
      this.prisma.device.count({ where }),
      this.prisma.device.count({ where: { ...where, operationalStatus: "ACTIVE" } }),
      this.prisma.device.count({ where: { ...where, assignmentStatus: "ASSIGNED" } }),
      this.prisma.device.count({ where: { ...where, assignmentStatus: "UNASSIGNED" } })
    ]);

    return {
      totalDevices,
      activeDevices,
      assignedDevices,
      unassignedDevices
    };
  }

  private async getScansByDay(where: Prisma.DeviceEventWhereInput) {
    const since = this.getSinceDate(DEFAULT_DAYS);
    const events = await this.prisma.deviceEvent.findMany({
      where: {
        ...where,
        createdAt: {
          gte: since
        }
      },
      select: {
        createdAt: true,
        eventType: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    const buckets = new Map<string, { date: string; total: number; qr: number; nfc: number }>();
    for (let index = DEFAULT_DAYS - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - index);
      const key = date.toISOString().slice(0, 10);
      buckets.set(key, { date: key, total: 0, qr: 0, nfc: 0 });
    }

    events.forEach((event) => {
      const key = event.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) return;

      bucket.total += 1;
      if (event.eventType === DeviceEventType.QR_SCAN) bucket.qr += 1;
      if (event.eventType === DeviceEventType.NFC_TAP) bucket.nfc += 1;
    });

    return Array.from(buckets.values());
  }

  private async getTopDevices(where: Prisma.DeviceEventWhereInput) {
    const grouped = await this.prisma.deviceEvent.groupBy({
      by: ["deviceId"],
      where: {
        ...where,
        deviceId: {
          not: null
        }
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          deviceId: "desc"
        }
      },
      take: 5
    });

    const deviceIds = grouped.flatMap((item) => (item.deviceId ? [item.deviceId] : []));
    const devices = await this.prisma.device.findMany({
      where: {
        id: {
          in: deviceIds
        }
      },
      include: {
        deviceType: true,
        business: true
      }
    });
    const devicesById = new Map(devices.map((device) => [device.id, device]));

    return grouped.map((item) => {
      const device = item.deviceId ? devicesById.get(item.deviceId) : null;

      return {
        deviceId: item.deviceId,
        publicCode: device?.publicCode ?? "Unknown",
        alias: device?.alias ?? null,
        deviceTypeName: device?.deviceType.name ?? null,
        businessName: device?.business?.businessName ?? null,
        scans: item._count._all
      };
    });
  }

  private async getTopClients(where: Prisma.DeviceEventWhereInput) {
    const events = await this.prisma.deviceEvent.findMany({
      where: {
        ...where,
        device: {
          businessId: {
            not: null
          }
        }
      },
      include: {
        device: {
          include: {
            business: true
          }
        }
      }
    });
    const totals = new Map<string, { businessId: string; businessName: string; scans: number }>();

    events.forEach((event) => {
      const business = event.device?.business;
      if (!business) return;

      const current = totals.get(business.id) ?? {
        businessId: business.id,
        businessName: business.businessName,
        scans: 0
      };
      current.scans += 1;
      totals.set(business.id, current);
    });

    return Array.from(totals.values())
      .sort((left, right) => right.scans - left.scans)
      .slice(0, 5);
  }

  private getLatestEvents(where: Prisma.DeviceEventWhereInput) {
    return this.prisma.deviceEvent.findMany({
      where,
      select: {
        id: true,
        eventType: true,
        source: true,
        referrer: true,
        createdAt: true,
        device: {
          select: {
            id: true,
            publicCode: true,
            alias: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });
  }

  private async ensureDeviceExists(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { id: true }
    });

    if (!device) {
      throw badRequest("DEVICE_NOT_FOUND", "Device not found");
    }
  }

  private buildScanWhere(deviceScope?: Prisma.DeviceWhereInput): Prisma.DeviceEventWhereInput {
    return {
      eventType: {
        in: [...SCAN_EVENT_TYPES]
      },
      ...(deviceScope ? { device: deviceScope } : {})
    };
  }

  private getSinceDate(days: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (days - 1));
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }
}
