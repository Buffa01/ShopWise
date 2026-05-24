import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../modules/app.module";
import { AssetsService } from "../modules/assets/assets.service";
import { PrismaService } from "../prisma/prisma.service";

async function main() {
  const publicCode = process.argv[2];

  if (!publicCode) {
    throw new Error("Usage: tsx src/scripts/regenerate-device-asset.ts <publicCode>");
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const assets = app.get(AssetsService);

  try {
    const device = await prisma.device.findUniqueOrThrow({
      where: { publicCode },
      select: { id: true, publicCode: true }
    });
    const asset = await assets.generateDeviceAssets(device.id);

    console.log(
      JSON.stringify(
        {
          publicCode: device.publicCode,
          assetId: asset.id,
          pdfKey: asset.pdfKey
        },
        null,
        2
      )
    );
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
