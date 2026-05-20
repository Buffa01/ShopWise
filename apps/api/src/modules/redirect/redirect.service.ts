import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import {
  DeviceEventSource,
  DeviceEventType,
  OperationalStatus,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

interface RedirectRequestMetadata {
  userAgent?: string;
  ip?: string;
  referrer?: string;
}

export interface RedirectResolution {
  status: "REDIRECT" | "FALLBACK";
  targetUrl?: string;
  reason?: "NOT_FOUND" | "NOT_CONFIGURED" | "INACTIVE" | "PAUSED" | "DISABLED" | "ARCHIVED";
  message: string;
}

@Injectable()
export class RedirectService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  resolveQr(code: string, metadata: RedirectRequestMetadata) {
    return this.resolve(code, DeviceEventSource.QR, metadata);
  }

  resolveNfc(code: string, metadata: RedirectRequestMetadata) {
    return this.resolve(code, DeviceEventSource.NFC, metadata);
  }

  private async resolve(
    rawCode: string,
    source: DeviceEventSource,
    metadata: RedirectRequestMetadata
  ): Promise<RedirectResolution> {
    const publicCode = rawCode.trim().toUpperCase();
    const device = await this.prisma.device.findUnique({
      where: { publicCode }
    });

    const eventType = source === DeviceEventSource.QR ? DeviceEventType.QR_SCAN : DeviceEventType.NFC_TAP;

    if (!device) {
      await this.createEvent(null, eventType, source, metadata, { publicCode });
      return {
        status: "FALLBACK",
        reason: "NOT_FOUND",
        message: "This ShopWise device does not exist."
      };
    }

    await this.prisma.$transaction([
      this.prisma.deviceEvent.create({
        data: this.buildEventData(device.id, eventType, source, metadata)
      }),
      this.prisma.device.update({
        where: { id: device.id },
        data: { lastScanAt: new Date() }
      })
    ]);

    if (!device.targetUrl) {
      return {
        status: "FALLBACK",
        reason: "NOT_CONFIGURED",
        message: "This ShopWise device is not configured yet."
      };
    }

    if (device.operationalStatus !== OperationalStatus.ACTIVE) {
      return {
        status: "FALLBACK",
        reason: device.operationalStatus,
        message: "This ShopWise device is not active."
      };
    }

    await this.createEvent(device.id, DeviceEventType.REDIRECT, source, metadata);

    return {
      status: "REDIRECT",
      targetUrl: device.targetUrl,
      message: "Redirecting..."
    };
  }

  private createEvent(
    deviceId: string | null,
    eventType: DeviceEventType,
    source: DeviceEventSource,
    metadata: RedirectRequestMetadata,
    extraMetadata?: Prisma.InputJsonObject
  ) {
    return this.prisma.deviceEvent.create({
      data: this.buildEventData(deviceId, eventType, source, metadata, extraMetadata)
    });
  }

  private buildEventData(
    deviceId: string | null,
    eventType: DeviceEventType,
    source: DeviceEventSource,
    metadata: RedirectRequestMetadata,
    extraMetadata?: Prisma.InputJsonObject
  ): Prisma.DeviceEventCreateInput {
    return {
      device: deviceId ? { connect: { id: deviceId } } : undefined,
      eventType,
      source,
      userAgent: metadata.userAgent,
      ipHash: metadata.ip ? this.hashIp(metadata.ip) : null,
      referrer: metadata.referrer,
      metadata: extraMetadata ?? Prisma.JsonNull
    };
  }

  private hashIp(ip: string) {
    const salt = process.env.IP_HASH_SALT ?? "shopwise-dev-salt";
    return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
  }
}
