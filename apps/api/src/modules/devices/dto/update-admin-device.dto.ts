import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from "class-validator";
import { OperationalStatus, ProductionStatus } from "@prisma/client";

export class UpdateAdminDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  alias?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({
    require_protocol: true,
    protocols: ["http", "https"]
  })
  @MaxLength(2000)
  targetUrl?: string;

  @IsOptional()
  @IsEnum(ProductionStatus)
  productionStatus?: ProductionStatus;

  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;
}
