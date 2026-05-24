import { IsIn, IsString, MaxLength } from "class-validator";

export class UploadDeviceTypeDesignDto {
  @IsString()
  @IsIn(["image/png", "image/jpeg"])
  contentType!: "image/png" | "image/jpeg";

  @IsString()
  @MaxLength(400)
  fileName!: string;

  @IsString()
  @MaxLength(15_000_000)
  dataUrl!: string;
}
