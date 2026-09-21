import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';

import { UpdateStudentProfileDto } from './dto/update-student-profile.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.studentProfile.findMany({
      select: this.studentSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id },
      select: this.studentSelect,
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: this.studentSelect,
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  async updateOwnProfile(userId: string, dto: UpdateStudentProfileDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.studentProfile.update({
      where: {
        id: student.id,
      },
      data: {
        ...(dto.section !== undefined && {
          section: dto.section.trim(),
        }),

        ...(dto.className !== undefined && {
          className: dto.className.trim(),
        }),

        ...(dto.bio !== undefined && {
          bio: dto.bio.trim(),
        }),
      },
      select: this.studentSelect,
    });
  }

  async updateProfile(id: string, dto: UpdateStudentProfileDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.studentProfile.update({
      where: { id },
      data: {
        ...(dto.section !== undefined && {
          section: dto.section.trim(),
        }),

        ...(dto.className !== undefined && {
          className: dto.className.trim(),
        }),

        ...(dto.bio !== undefined && {
          bio: dto.bio.trim(),
        }),
      },
      select: this.studentSelect,
    });
  }

  async remove(id: string): Promise<void> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.studentProfile.delete({
      where: { id },
    });
  }

  private readonly studentSelect = {
    id: true,
    userId: true,
    section: true,
    className: true,
    bio: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    },
  } as const;
}
