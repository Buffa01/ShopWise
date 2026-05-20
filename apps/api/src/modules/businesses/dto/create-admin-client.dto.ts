import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from "class-validator";

export class CreateAdminClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  businessName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({
    require_protocol: true,
    protocols: ["http", "https"]
  })
  @MaxLength(2000)
  defaultTargetUrl?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({
    require_protocol: true,
    protocols: ["http", "https"]
  })
  @MaxLength(2000)
  googleReviewUrl?: string;
}
