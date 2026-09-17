import {
  ConflictException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
