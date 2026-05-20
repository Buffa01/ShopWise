import { IsOptional, IsString, MaxLength, Matches } from "class-validator";

export class CreateDeviceDto {
  @IsString()
  deviceTypeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Matches(/^[A-Z0-9]+$/)
  prefix?: string;
}

