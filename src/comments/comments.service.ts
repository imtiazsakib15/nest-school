import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    studentUserId: string,
    teacherProfileId: string,
    dto: CreateCommentDto,
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

    const content = dto.content.trim();

    if (!content) {
      throw new ConflictException('Comment cannot be empty');
    }

    return this.prisma.comment.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        content,
      },
      select: this.commentSelect,
    });
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

    return this.prisma.comment.findMany({
      where: {
        teacherId: teacher.id,
      },
      select: this.commentSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOwnComments(studentUserId: string) {
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

    return this.prisma.comment.findMany({
      where: {
        studentId: student.id,
      },
      select: this.commentSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateOwnComment(
    studentUserId: string,
    commentId: string,
    dto: UpdateCommentDto,
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

    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.studentId !== student.id) {
      throw new ForbiddenException('You can only modify your own comments');
    }

    const content = dto.content?.trim();

    if (content === '') {
      throw new ConflictException('Comment cannot be empty');
    }

    return this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        ...(content !== undefined && {
          content,
        }),
      },
      select: this.commentSelect,
    });
  }

  async deleteOwnComment(
    studentUserId: string,
    commentId: string,
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

    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.studentId !== student.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
  }

  async removeByAdmin(commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
  }

  private readonly commentSelect = {
    id: true,
    content: true,
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
