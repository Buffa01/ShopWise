import { Inject, Injectable } from "@nestjs/common";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { ProductionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "./storage.service";

const STICKER_SIZE_MM = 100;
const POINTS_PER_MM = 72 / 25.4;
const STICKER_SIZE_POINTS = STICKER_SIZE_MM * POINTS_PER_MM;

@Injectable()
export class AssetsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService
  ) {}

  async generateDeviceAssets(deviceId: string) {
    const device = await this.prisma.device.findUniqueOrThrow({
      where: { id: deviceId },
      include: { deviceType: true }
    });

    const qrPng = await QRCode.toBuffer(device.qrUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      scale: 12,
      type: "png",
      color: {
        dark: "#111827",
        light: "#FFFFFF"
      }
    });

    const qrImageKey = `devices/${device.publicCode}/qr.png`;
    await this.storage.write(qrImageKey, qrPng);

    const pdf = await this.renderStickerPdf({
      publicCode: device.publicCode,
      qrPng,
      deviceTypeName: device.deviceType.name
    });

    const pdfKey = `devices/${device.publicCode}/sticker.pdf`;
    await this.storage.write(pdfKey, pdf);

    const printAsset = await this.prisma.printAsset.create({
      data: {
        deviceId: device.id,
        templateKey: device.deviceType.templateKey ?? "sticker/default",
        pdfKey,
        widthMm: STICKER_SIZE_MM,
        heightMm: STICKER_SIZE_MM,
        dpi: 300
      }
    });

    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        qrImageKey,
        latestPrintAssetId: printAsset.id,
        productionStatus: ProductionStatus.ASSET_GENERATED
      }
    });

    await this.prisma.deviceEvent.create({
      data: {
        deviceId: device.id,
        eventType: "ASSET_GENERATED",
        source: "SYSTEM",
        metadata: {
          qrImageKey,
          pdfKey
        }
      }
    });

    return printAsset;
  }

  async getLatestPrintAssetFile(deviceId: string) {
    const asset = await this.prisma.printAsset.findFirst({
      where: { deviceId, pdfKey: { not: null } },
      orderBy: { createdAt: "desc" },
      include: {
        device: true
      }
    });

    if (!asset?.pdfKey) {
      return null;
    }

    return {
      asset,
      publicCode: asset.device.publicCode,
      file: await this.storage.read(asset.pdfKey)
    };
  }

  private async renderStickerPdf(input: {
    publicCode: string;
    qrPng: Buffer;
    deviceTypeName: string;
  }) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([STICKER_SIZE_POINTS, STICKER_SIZE_POINTS]);
    const qrImage = await pdfDoc.embedPng(input.qrPng);

    const center = STICKER_SIZE_POINTS / 2;
    const radius = STICKER_SIZE_POINTS / 2 - 3;

    page.drawCircle({
      x: center,
      y: center,
      size: radius,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.08, 0.47, 0.43),
      borderWidth: 2
    });

    page.drawText("ShopWise", {
      x: 88,
      y: STICKER_SIZE_POINTS - 46,
      size: 18,
      color: rgb(0.06, 0.46, 0.43)
    });

    page.drawText(input.deviceTypeName, {
      x: 72,
      y: STICKER_SIZE_POINTS - 68,
      size: 10,
      color: rgb(0.35, 0.39, 0.45)
    });

    const qrSize = STICKER_SIZE_POINTS * 0.48;
    page.drawImage(qrImage, {
      x: center - qrSize / 2,
      y: center - qrSize / 2 - 4,
      width: qrSize,
      height: qrSize
    });

    page.drawText(input.publicCode, {
      x: center - 25,
      y: 38,
      size: 11,
      color: rgb(0.07, 0.09, 0.15)
    });

    return pdfDoc.save();
  }
}
