import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { conflict, unauthorized } from "../../common/errors/http-errors";
import type { CurrentUser, JwtAccessTokenPayload } from "../../common/types/authenticated-request";
import { PrismaService } from "../../prisma/prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { AuthResponse, AuthUserResponse } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw conflict("AUTH_EMAIL_ALREADY_EXISTS", "A user with this email already exists");
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
            businessName: dto.businessName.trim()
          }
        }
      },
      include: {
        business: true
      }
    });

    return this.buildAuthResponse(this.toAuthUser(user));
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        business: true
      }
    });

    if (!user) {
      throw unauthorized("AUTH_INVALID_CREDENTIALS", "Invalid email or password");
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw unauthorized("AUTH_INVALID_CREDENTIALS", "Invalid email or password");
    }

    return this.buildAuthResponse(this.toAuthUser(user));
  }

  async getMe(currentUser: CurrentUser): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: currentUser.id },
      include: {
        business: true
      }
    });

    return this.toAuthUser(user);
  }

  private buildAuthResponse(user: AuthUserResponse): AuthResponse {
    const payload: JwtAccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user
    };
  }

  private toAuthUser(user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    business: { id: string } | null;
  }): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.business?.id ?? null
    };
  }
}
