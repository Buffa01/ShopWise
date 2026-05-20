import { IsBoolean, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateDeviceTypeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Matches(/^[A-Z0-9]+$/)
  defaultPrefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  templateKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  baseDesignKey?: string;

  @IsOptional()
  @IsObject()
  qrPosition?: Record<string, unknown>;
}

