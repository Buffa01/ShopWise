import { IsInt, IsOptional, Max, Min } from "class-validator";

export class CleanupExpiredAssetsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays?: number;
}
