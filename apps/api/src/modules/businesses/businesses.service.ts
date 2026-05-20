import { Inject, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { badRequest, conflict } from "../../common/errors/http-errors";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateAdminClientDto } from "./dto/create-admin-client.dto";

@Injectable()
export class BusinessesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.business.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            devices: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });
  }

  async get(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        devices: {
          include: {
            deviceType: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!business) {
      throw badRequest("BUSINESS_NOT_FOUND", "Client business not found");
    }

    return business;
  }

  async create(dto: CreateAdminClientDto) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw conflict("BUSINESS_EMAIL_ALREADY_EXISTS", "A user with this email already exists");
    }

    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name?.trim() || null,
        email,
        passwordHash,
        role: UserRole.CLIENT,
        business: {
          create: {
            businessName: dto.businessName.trim(),
            phone: dto.phone?.trim() || null,
            address: dto.address?.trim() || null,
            defaultTargetUrl: dto.defaultTargetUrl?.trim() || null,
            googleReviewUrl: dto.googleReviewUrl?.trim() || null
          }
        }
      },
      include: {
        business: true
      }
    });

    if (!user.business) {
      throw badRequest("BUSINESS_NOT_FOUND", "Client business not found");
    }

    return this.get(user.business.id);
  }
}
