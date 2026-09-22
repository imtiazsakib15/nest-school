import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto.js';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teacherProfile.findMany({
      select: this.teacherSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id },
      select: this.teacherSelect,
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      select: this.teacherSelect,
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher;
  }

  async updateOwnProfile(userId: string, dto: UpdateTeacherProfileDto) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.prisma.teacherProfile.update({
      where: {
        id: teacher.id,
      },
      data: {
        ...(dto.subject !== undefined && {
          subject: dto.subject.trim(),
        }),

        ...(dto.bio !== undefined && {
          bio: dto.bio.trim(),
        }),
      },
      select: this.teacherSelect,
    });
  }

  async updateProfile(id: string, dto: UpdateTeacherProfileDto) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.teacherProfile.update({
      where: { id },
      data: {
        ...(dto.subject !== undefined && {
          subject: dto.subject.trim(),
        }),

        ...(dto.bio !== undefined && {
          bio: dto.bio.trim(),
        }),
      },
      select: this.teacherSelect,
    });
  }

  private readonly teacherSelect = {
    id: true,
    userId: true,
    subject: true,
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
