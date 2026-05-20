import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, Matches } from "class-validator";

export class CreateDeviceBatchDto {
  @IsString()
  deviceTypeId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Matches(/^[A-Z0-9]+$/)
  prefix?: string;
}

