import { Inject, Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

const CODE_LENGTH = 6;
const BASE = 36n;

@Injectable()
export class CodeGeneratorService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async allocateCodes(prefix: string, quantity: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const normalizedPrefix = prefix.trim().toUpperCase();

    const sequence = await this.upsertAndIncrement(client, normalizedPrefix, quantity);
    const startValue = sequence.nextValue - BigInt(quantity);

    return Array.from({ length: quantity }, (_, index) => {
      const value = startValue + BigInt(index);
      return `${normalizedPrefix}${this.toBase36(value)}`;
    });
  }

  buildLinks(publicCode: string) {
    const shortDomain = process.env.SHORT_LINK_BASE_URL ?? "https://sw.uy";
    const qrPath = `/r/${publicCode}`;
    const nfcPath = `/n/${publicCode}`;

    return {
      qrPath,
      nfcPath,
      qrUrl: `${shortDomain}${qrPath}`,
      nfcUrl: `${shortDomain}${nfcPath}`
    };
  }

  private async upsertAndIncrement(
    client: Prisma.TransactionClient | PrismaClient,
    prefix: string,
    quantity: number
  ) {
    return client.codeSequence.upsert({
      where: { prefix },
      update: {
        nextValue: {
          increment: quantity
        }
      },
      create: {
        prefix,
        nextValue: BigInt(quantity + 1)
      }
    });
  }

  private toBase36(value: bigint) {
    if (value < 1n) {
      throw new Error("Code sequence value must be positive");
    }

    let current = value;
    let result = "";

    while (current > 0n) {
      const remainder = current % BASE;
      result = remainder.toString(36).toUpperCase() + result;
      current = current / BASE;
    }

    return result.padStart(CODE_LENGTH, "0");
  }
}

