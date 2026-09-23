import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateRatingDto } from './dto/create-rating.dto.js';
import { UpdateRatingDto } from './dto/update-rating.dto.js';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    studentUserId: string,
    teacherProfileId: string,
    dto: CreateRatingDto,
  ) {
    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId: studentUserId,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const teacher = await this.prisma.teacherProfile.findUnique({
      where: {
        id: teacherProfileId,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const existingRating = await this.prisma.rating.findUnique({
      where: {
        teacherId_studentId: {
          teacherId: teacher.id,
          studentId: student.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingRating) {
      throw new ConflictException('You have already rated this teacher');
    }

    try {
      return await this.prisma.rating.create({
        data: {
          teacherId: teacher.id,
          studentId: student.id,
          score: dto.score,
          comment: dto.comment?.trim(),
        },
        select: this.ratingSelect,
      });
    } catch (error) {
      // The database unique constraint remains
      // the final protection against duplicates.
      throw error;
    }
  }

  async findByTeacher(teacherProfileId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: {
        id: teacherProfileId,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.rating.findMany({
      where: {
        teacherId: teacher.id,
      },
      select: this.ratingSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOwnRatings(studentUserId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId: studentUserId,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.rating.findMany({
      where: {
        studentId: student.id,
      },
      select: this.ratingSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateOwnRating(
    studentUserId: string,
    ratingId: string,
    dto: UpdateRatingDto,
  ) {
    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId: studentUserId,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const rating = await this.prisma.rating.findUnique({
      where: {
        id: ratingId,
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.studentId !== student.id) {
      throw new ForbiddenException('You can only modify your own ratings');
    }

    return this.prisma.rating.update({
      where: {
        id: ratingId,
      },
      data: {
        ...(dto.score !== undefined && {
          score: dto.score,
        }),

        ...(dto.comment !== undefined && {
          comment: dto.comment.trim(),
        }),
      },
      select: this.ratingSelect,
    });
  }

  async deleteOwnRating(
    studentUserId: string,
    ratingId: string,
  ): Promise<void> {
    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId: studentUserId,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const rating = await this.prisma.rating.findUnique({
      where: {
        id: ratingId,
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.studentId !== student.id) {
      throw new ForbiddenException('You can only delete your own ratings');
    }

    await this.prisma.rating.delete({
      where: {
        id: ratingId,
      },
    });
  }

  private readonly ratingSelect = {
    id: true,
    score: true,
    comment: true,
    createdAt: true,
    updatedAt: true,

    student: {
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },

    teacher: {
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  } as const;
}
