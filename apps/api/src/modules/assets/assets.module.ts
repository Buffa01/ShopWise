import { Module } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import { StorageService } from "./storage.service";

@Module({
  providers: [AssetsService, StorageService],
  exports: [AssetsService, StorageService]
})
export class AssetsModule {}

