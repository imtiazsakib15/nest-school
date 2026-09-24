import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Role } from '../generated/prisma/enums.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { CommentsService } from './comments.service.js';

@Controller({
  path: 'comments',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('teachers/:teacherId')
  @Roles(Role.STUDENT)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.userId, teacherId, dto);
  }

  @Get('teachers/:teacherId')
  @Roles(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN)
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.commentsService.findByTeacher(teacherId);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  findOwnComments(@CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.findOwnComments(user.userId);
  }

  @Patch(':id')
  @Roles(Role.STUDENT)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateOwnComment(user.userId, commentId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.STUDENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') commentId: string,
  ) {
    return this.commentsService.deleteOwnComment(user.userId, commentId);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPER_ADMIN)
  removeByAdmin(@Param('id') commentId: string) {
    return this.commentsService.removeByAdmin(commentId);
  }
}
