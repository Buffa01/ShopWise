import { IsString, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class ClaimDeviceDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z0-9]+$/)
  code!: string;
}
