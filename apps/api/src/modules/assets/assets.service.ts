import { Inject, Injectable } from "@nestjs/common";
import { PDFDocument, PDFImage, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { ProductionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "./storage.service";

const STICKER_SIZE_MM = 100;
const PRINT_SHEET_WIDTH_MM = 1300;
const PRINT_SHEET_GAP_MM = 20;
const POINTS_PER_MM = 72 / 25.4;
const STICKER_SIZE_POINTS = STICKER_SIZE_MM * POINTS_PER_MM;

interface StickerQrTemplate {
  unit: "mm";
  sticker: {
    shape: "circle" | "rectangle";
    widthMm: number;
    heightMm: number;
    diameterMm?: number;
  };
  qr: {
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
  };
}

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
      deviceTypeName: device.deviceType.name,
      baseDesignKey: device.deviceType.baseDesignKey,
      qrPosition: device.deviceType.qrPosition
    });

    const pdfKey = `devices/${device.publicCode}/sticker.pdf`;
    await this.storage.write(pdfKey, pdf);

    const printAsset = await this.prisma.printAsset.create({
      data: {
        deviceId: device.id,
        templateKey: device.deviceType.templateKey ?? "sticker/default",
        pdfKey,
        widthMm: this.getTemplate(device.deviceType.qrPosition).sticker.widthMm,
        heightMm: this.getTemplate(device.deviceType.qrPosition).sticker.heightMm,
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

  async generateBatchPrintSheet(batchId: string) {
    const batch = await this.prisma.deviceBatch.findUnique({
      where: { id: batchId },
      include: {
        devices: {
          orderBy: { publicCode: "asc" },
          include: {
            printAssets: {
              orderBy: { createdAt: "desc" },
              take: 1
            }
          }
        }
      }
    });

    if (!batch || !batch.devices.length) {
      return null;
    }

    const devicesWithAssets = batch.devices.filter((device) => device.printAssets[0]?.pdfKey);

    if (!devicesWithAssets.length) {
      return null;
    }

    const sheetPdf = await PDFDocument.create();
    const stickerSizePoints = STICKER_SIZE_MM * POINTS_PER_MM;
    const gapPoints = PRINT_SHEET_GAP_MM * POINTS_PER_MM;
    const pageWidth = PRINT_SHEET_WIDTH_MM * POINTS_PER_MM;
    const columns = Math.max(
      1,
      Math.floor((PRINT_SHEET_WIDTH_MM + PRINT_SHEET_GAP_MM) / (STICKER_SIZE_MM + PRINT_SHEET_GAP_MM))
    );
    const rows = Math.ceil(devicesWithAssets.length / columns);
    const pageHeight = (rows * STICKER_SIZE_MM + Math.max(0, rows - 1) * PRINT_SHEET_GAP_MM) * POINTS_PER_MM;
    const page = sheetPdf.addPage([pageWidth, pageHeight]);

    for (const [index, device] of devicesWithAssets.entries()) {
      const pdfKey = device.printAssets[0]?.pdfKey;
      if (!pdfKey) continue;

      const [embeddedSticker] = await sheetPdf.embedPdf(toPdfLibBytes(await this.storage.read(pdfKey)), [0]);
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = column * (stickerSizePoints + gapPoints);
      const y = pageHeight - stickerSizePoints - row * (stickerSizePoints + gapPoints);

      page.drawPage(embeddedSticker, {
        x,
        y,
        width: stickerSizePoints,
        height: stickerSizePoints
      });
    }

    return {
      batch,
      columns,
      rows,
      widthMm: PRINT_SHEET_WIDTH_MM,
      heightMm: pageHeight / POINTS_PER_MM,
      file: await sheetPdf.save()
    };
  }

  private async renderStickerPdf(input: {
    publicCode: string;
    qrPng: Buffer;
    deviceTypeName: string;
    baseDesignKey: string | null;
    qrPosition: unknown;
  }) {
    const template = this.getTemplate(input.qrPosition);
    const pageWidth = template.sticker.widthMm * POINTS_PER_MM;
    const pageHeight = template.sticker.heightMm * POINTS_PER_MM;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const qrImage = await pdfDoc.embedPng(toPdfLibBytes(input.qrPng));

    const baseDesign = input.baseDesignKey ? await this.embedBaseDesign(pdfDoc, input.baseDesignKey) : null;

    if (baseDesign) {
      page.drawImage(baseDesign, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });
    } else {
      this.drawFallbackSticker(page, {
        publicCode: input.publicCode,
        deviceTypeName: input.deviceTypeName,
        pageWidth,
        pageHeight,
        qrImage
      });
      return pdfDoc.save();
    }

    const qrWidth = template.qr.widthMm * POINTS_PER_MM;
    const qrHeight = template.qr.heightMm * POINTS_PER_MM;

    page.drawImage(qrImage, {
      x: template.qr.xMm * POINTS_PER_MM,
      y: pageHeight - (template.qr.yMm + template.qr.heightMm) * POINTS_PER_MM,
      width: qrWidth,
      height: qrHeight
    });

    return pdfDoc.save();
  }

  private async embedBaseDesign(pdfDoc: PDFDocument, key: string): Promise<PDFImage | null> {
    const file = await this.storage.read(key);

    if (key.endsWith(".png")) {
      if (!isPdfLibSafePng(file)) {
        return null;
      }

      return pdfDoc.embedPng(toPdfLibBytes(file));
    }

    if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
      return pdfDoc.embedJpg(toPdfLibBytes(file));
    }

    return null;
  }

  private drawFallbackSticker(
    page: ReturnType<PDFDocument["addPage"]>,
    input: {
      publicCode: string;
      qrImage: PDFImage;
      deviceTypeName: string;
      pageWidth: number;
      pageHeight: number;
    }
  ) {
    const center = input.pageWidth / 2;
    const radius = Math.min(input.pageWidth, input.pageHeight) / 2 - 3;

    page.drawCircle({
      x: center,
      y: input.pageHeight / 2,
      size: radius,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.08, 0.47, 0.43),
      borderWidth: 2
    });

    page.drawText("ShopWise", {
      x: 88,
      y: input.pageHeight - 46,
      size: 18,
      color: rgb(0.06, 0.46, 0.43)
    });

    page.drawText(input.deviceTypeName, {
      x: 72,
      y: input.pageHeight - 68,
      size: 10,
      color: rgb(0.35, 0.39, 0.45)
    });

    const qrSize = Math.min(input.pageWidth, input.pageHeight) * 0.48;
    page.drawImage(input.qrImage, {
      x: center - qrSize / 2,
      y: input.pageHeight / 2 - qrSize / 2 - 4,
      width: qrSize,
      height: qrSize
    });

    page.drawText(input.publicCode, {
      x: center - 25,
      y: 38,
      size: 11,
      color: rgb(0.07, 0.09, 0.15)
    });
  }

  private getTemplate(value: unknown): StickerQrTemplate {
    const fallbackQrSize = 32;
    const fallbackOffset = (STICKER_SIZE_MM - fallbackQrSize) / 2;
    const fallback: StickerQrTemplate = {
      unit: "mm",
      sticker: {
        shape: "circle",
        widthMm: STICKER_SIZE_MM,
        heightMm: STICKER_SIZE_MM,
        diameterMm: STICKER_SIZE_MM
      },
      qr: {
        xMm: fallbackOffset,
        yMm: fallbackOffset,
        widthMm: fallbackQrSize,
        heightMm: fallbackQrSize
      }
    };

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return fallback;
    }

    const candidate = value as Partial<StickerQrTemplate>;
    const sticker = candidate.sticker;
    const qr = candidate.qr;

    if (candidate.unit !== "mm" || !sticker || !qr) {
      return fallback;
    }

    const widthMm = this.positiveNumber(sticker.widthMm, STICKER_SIZE_MM);
    const heightMm = this.positiveNumber(sticker.heightMm, STICKER_SIZE_MM);
    const qrWidthMm = this.positiveNumber(qr.widthMm, fallback.qr.widthMm);
    const qrHeightMm = this.positiveNumber(qr.heightMm, fallback.qr.heightMm);

    return {
      unit: "mm",
      sticker: {
        shape: sticker.shape === "rectangle" ? "rectangle" : "circle",
        widthMm,
        heightMm,
        diameterMm: this.positiveNumber(sticker.diameterMm, Math.min(widthMm, heightMm))
      },
      qr: {
        xMm: this.clampNumber(qr.xMm, 0, widthMm - qrWidthMm, fallback.qr.xMm),
        yMm: this.clampNumber(qr.yMm, 0, heightMm - qrHeightMm, fallback.qr.yMm),
        widthMm: qrWidthMm,
        heightMm: qrHeightMm
      }
    };
  }

  private positiveNumber(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private clampNumber(value: unknown, min: number, max: number, fallback: number) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(Math.max(value, min), Math.max(min, max));
  }
}

function toPdfLibBytes(data: Buffer | Uint8Array) {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function isPdfLibSafePng(data: Buffer | Uint8Array) {
  const pngSignature = "89504e470d0a1a0a";
  const pngColorType = data[25];

  return data.length >= 26 && Buffer.from(data.subarray(0, 8)).toString("hex") === pngSignature && pngColorType !== 2;
}
