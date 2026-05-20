import { IsIn, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from "class-validator";
import { OperationalStatus } from "@prisma/client";

const CLIENT_OPERATIONAL_STATUSES = [
  OperationalStatus.ACTIVE,
  OperationalStatus.PAUSED,
  OperationalStatus.INACTIVE
] as const;

export class UpdateClientDeviceDto {
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
  @IsIn(CLIENT_OPERATIONAL_STATUSES)
  operationalStatus?: (typeof CLIENT_OPERATIONAL_STATUSES)[number];
}
