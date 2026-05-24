import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { badRequest } from "../../common/errors/http-errors";
import { PrismaService } from "../../prisma/prisma.service";

type StorageDriver = "local" | "r2";

const DEFAULT_TOTAL_LIMIT_BYTES = 9_000_000_000n;
const DEFAULT_MAX_OBJECT_BYTES = 52_428_800n;

@Injectable()
export class StorageService {
  private readonly rootDir: string;
  private readonly driver: StorageDriver;
  private readonly totalLimitBytes: bigint;
  private readonly maxObjectBytes: bigint;
  private readonly r2Bucket: string | null;
  private readonly r2Client: S3Client | null;

  constructor(
    @Inject(ConfigService) config: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {
    this.rootDir = config.get<string>("STORAGE_LOCAL_DIR") ?? "storage";
    this.driver = this.parseDriver(config.get<string>("STORAGE_DRIVER"));
    this.totalLimitBytes = this.parseBytes(config.get<string>("STORAGE_TOTAL_LIMIT_BYTES"), DEFAULT_TOTAL_LIMIT_BYTES);
    this.maxObjectBytes = this.parseBytes(config.get<string>("STORAGE_MAX_OBJECT_BYTES"), DEFAULT_MAX_OBJECT_BYTES);
    this.r2Bucket = config.get<string>("R2_BUCKET")?.trim() || null;
    this.r2Client = this.driver === "r2" ? this.createR2Client(config) : null;
  }

  async write(key: string, data: Buffer | Uint8Array) {
    await this.assertStorageCapacity(key, data.byteLength);

    if (this.driver === "r2") {
      await this.writeR2(key, data);
    } else {
      const path = this.resolvePath(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data);
    }

    await this.prisma.storageObject.upsert({
      where: { key },
      create: {
        key,
        byteSize: data.byteLength,
        driver: this.driver
      },
      update: {
        byteSize: data.byteLength,
        driver: this.driver
      }
    });

    return key;
  }

  async read(key: string) {
    if (this.driver === "r2") {
      return this.readR2(key);
    }

    return readFile(this.resolvePath(key));
  }

  resolvePath(key: string) {
    return join(process.cwd(), "../../", this.rootDir, key);
  }

  async getUsage() {
    const aggregate = await this.prisma.storageObject.aggregate({
      _sum: {
        byteSize: true
      }
    });
    const usedBytes = aggregate._sum.byteSize ?? 0n;

    return {
      usedBytes,
      totalLimitBytes: this.totalLimitBytes,
      maxObjectBytes: this.maxObjectBytes
    };
  }

  private async assertStorageCapacity(key: string, byteLength: number) {
    const incomingBytes = BigInt(byteLength);

    if (incomingBytes > this.maxObjectBytes) {
      throw badRequest("STORAGE_OBJECT_TOO_LARGE", "Stored object exceeds the configured per-file limit", {
        key,
        objectBytes: byteLength,
        maxObjectBytes: this.maxObjectBytes.toString()
      });
    }

    const [aggregate, existing] = await Promise.all([
      this.prisma.storageObject.aggregate({
        _sum: {
          byteSize: true
        }
      }),
      this.prisma.storageObject.findUnique({
        where: { key },
        select: { byteSize: true }
      })
    ]);
    const usedBytes = aggregate._sum.byteSize ?? 0n;
    const existingBytes = existing?.byteSize ?? 0n;
    const projectedBytes = usedBytes - existingBytes + incomingBytes;

    if (projectedBytes > this.totalLimitBytes) {
      throw badRequest("STORAGE_LIMIT_EXCEEDED", "Storage limit reached", {
        key,
        usedBytes: usedBytes.toString(),
        incomingBytes: incomingBytes.toString(),
        projectedBytes: projectedBytes.toString(),
        totalLimitBytes: this.totalLimitBytes.toString()
      });
    }
  }

  private writeR2(key: string, data: Buffer | Uint8Array) {
    const bucket = this.requireR2Bucket();

    return this.requireR2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(data)
      })
    );
  }

  private async readR2(key: string) {
    const bucket = this.requireR2Bucket();
    const response = await this.requireR2Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    if (!response.Body) {
      return Buffer.alloc(0);
    }

    const body = response.Body as {
      transformToByteArray?: () => Promise<Uint8Array>;
      [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | Buffer | string>;
    };

    if (body.transformToByteArray) {
      return Buffer.from(await body.transformToByteArray());
    }

    if (body[Symbol.asyncIterator]) {
      const chunks: Buffer[] = [];

      for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    }

    if (response.Body instanceof Uint8Array) {
      return Buffer.from(response.Body);
    }

    throw badRequest("STORAGE_NOT_CONFIGURED", "Unsupported R2 response body");
  }

  private requireR2Client() {
    if (!this.r2Client) {
      throw badRequest("STORAGE_NOT_CONFIGURED", "R2 storage is not configured");
    }

    return this.r2Client;
  }

  private requireR2Bucket() {
    if (!this.r2Bucket) {
      throw badRequest("STORAGE_NOT_CONFIGURED", "R2_BUCKET is required when STORAGE_DRIVER is r2");
    }

    return this.r2Bucket;
  }

  private createR2Client(config: ConfigService) {
    const endpoint = config.get<string>("R2_ENDPOINT")?.trim();
    const accessKeyId = config.get<string>("R2_ACCESS_KEY_ID")?.trim();
    const secretAccessKey = config.get<string>("R2_SECRET_ACCESS_KEY")?.trim();

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.r2Bucket) {
      throw badRequest(
        "STORAGE_NOT_CONFIGURED",
        "R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required when STORAGE_DRIVER is r2"
      );
    }

    return new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  private parseDriver(value: string | undefined): StorageDriver {
    if (!value) {
      return "local";
    }

    if (value === "local" || value === "r2") {
      return value;
    }

    throw badRequest("STORAGE_NOT_CONFIGURED", "STORAGE_DRIVER must be local or r2");
  }

  private parseBytes(value: string | undefined, fallback: bigint) {
    if (!value) {
      return fallback;
    }

    if (!/^[1-9][0-9]*$/.test(value)) {
      throw badRequest("STORAGE_NOT_CONFIGURED", "Storage byte limits must be positive integers");
    }

    return BigInt(value);
  }
}
