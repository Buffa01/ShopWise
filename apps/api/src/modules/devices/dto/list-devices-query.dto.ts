import { IsEnum, IsOptional, IsString } from "class-validator";
import { AssignmentStatus, OperationalStatus, ProductionStatus } from "@prisma/client";

export class ListDevicesQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  deviceTypeId?: string;

  @IsOptional()
  @IsEnum(ProductionStatus)
  productionStatus?: ProductionStatus;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  assignmentStatus?: AssignmentStatus;

  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;
}

