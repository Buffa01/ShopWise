import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@shopwise.uy";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me";
  const adminName = process.env.ADMIN_NAME ?? "ShopWise Admin";

  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: UserRole.ADMIN
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  await prisma.deviceType.upsert({
    where: { slug: "google-review" },
    update: {
      name: "Google Reviews",
      isActive: true,
      defaultPrefix: "A",
      templateKey: "sticker/google-review"
    },
    create: {
      name: "Google Reviews",
      slug: "google-review",
      description: "Google Reviews QR + NFC sticker",
      isActive: true,
      defaultPrefix: "A",
      templateKey: "sticker/google-review",
      qrPosition: {
        unit: "mm",
        pendingMeasurement: true
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

