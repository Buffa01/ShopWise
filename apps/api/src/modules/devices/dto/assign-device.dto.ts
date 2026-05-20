import { IsString } from "class-validator";

export class AssignDeviceDto {
  @IsString()
  businessId!: string;
}
