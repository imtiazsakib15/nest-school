import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password, role } = registerDto;

    const normalizedEmail = email.trim().toLowerCase();

    if (role === Role.SUPER_ADMIN) {
      throw new BadRequestException(
        'SUPER_ADMIN accounts cannot be created through public registration',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: passwordHash,
          role,
        },
      });

      if (role === Role.STUDENT) {
        await tx.studentProfile.create({
          data: {
            userId: createdUser.id,
          },
        });
      }

      if (role === Role.TEACHER) {
        await tx.teacherProfile.create({
          data: {
            userId: createdUser.id,
          },
        });
      }

      return createdUser;
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordValid = await argon2.verify(user.password, loginDto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.createAccessToken(user.id, user.role);

    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async refresh(refreshToken: string) {
    const { tokenId, secret } = this.parseRefreshToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenId,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const secretMatches = await argon2.verify(storedToken.tokenHash, secret);

    if (!secretMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: storedToken.userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive or unavailable',
      );
    }

    const newAccessToken = await this.createAccessToken(user.id, user.role);

    const result = await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revoked: false,
        },
        data: {
          revoked: true,
        },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token has already been used');
      }

      const {
        tokenId: newTokenId,
        secret: newSecret,
        token: newRefreshToken,
      } = this.generateRefreshToken();

      const newTokenHash = await argon2.hash(newSecret, {
        type: argon2.argon2id,
      });

      await tx.refreshToken.create({
        data: {
          tokenId: newTokenId,
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt: this.getRefreshTokenExpiry(),
        },
      });

      return newRefreshToken;
    });

    return {
      accessToken: newAccessToken,
      refreshToken: result,
    };
  }

  private async createAccessToken(userId: string, role: Role): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      role,
    });
  }

  private generateRefreshToken(): {
    tokenId: string;
    secret: string;
    token: string;
  } {
    const tokenId = randomUUID();
    const secret = randomBytes(64).toString('hex');

    return {
      tokenId,
      secret,
      token: `${tokenId}.${secret}`,
    };
  }

  private async hashRefreshToken(token: string): Promise<string> {
    return argon2.hash(token, {
      type: argon2.argon2id,
    });
  }

  private getRefreshTokenExpiry(): Date {
    const expiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );

    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error(
        'Invalid JWT_REFRESH_EXPIRES_IN format. Use values like 15m, 7d, 12h.',
      );
    }

    const value = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const { tokenId, secret, token } = this.generateRefreshToken();

    const tokenHash = await argon2.hash(secret, {
      type: argon2.argon2id,
    });

    await this.prisma.refreshToken.create({
      data: {
        tokenId,
        userId,
        tokenHash,
        expiresAt: this.getRefreshTokenExpiry(),
      },
    });

    return token;
  }

  private parseRefreshToken(token: string): {
    tokenId: string;
    secret: string;
  } {
    const separatorIndex = token.indexOf('.');

    if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      tokenId: token.slice(0, separatorIndex),
      secret: token.slice(separatorIndex + 1),
    };
  }
}
