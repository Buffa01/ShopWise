import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { BusinessesService } from "./businesses.service";
import { CreateAdminClientDto } from "./dto/create-admin-client.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/clients")
export class BusinessesController {
  constructor(@Inject(BusinessesService) private readonly businessesService: BusinessesService) {}

  @Get()
  list() {
    return this.businessesService.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.businessesService.get(id);
  }

  @Post()
  create(@Body() dto: CreateAdminClientDto) {
    return this.businessesService.create(dto);
  }
}
