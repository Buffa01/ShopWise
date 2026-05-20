import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StorageService {
  private readonly rootDir: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.rootDir = config.get<string>("STORAGE_LOCAL_DIR") ?? "storage";
  }

  async write(key: string, data: Buffer | Uint8Array) {
    const path = this.resolvePath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return key;
  }

  read(key: string) {
    return readFile(this.resolvePath(key));
  }

  resolvePath(key: string) {
    return join(process.cwd(), "../../", this.rootDir, key);
  }
}

