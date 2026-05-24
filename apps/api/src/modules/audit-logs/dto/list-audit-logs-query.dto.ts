import { IsOptional, IsString, MaxLength } from "class-validator";

export class ListAuditLogsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @IsOptional()
  @IsString()
  actorUserId?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
