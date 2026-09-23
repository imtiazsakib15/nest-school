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

import { CreateRatingDto } from './dto/create-rating.dto.js';
import { UpdateRatingDto } from './dto/update-rating.dto.js';
import { RatingsService } from './ratings.service.js';

@Controller({
  path: 'ratings',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('teachers/:teacherId')
  @Roles(Role.STUDENT)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.create(user.userId, teacherId, dto);
  }

  @Get('teachers/:teacherId')
  @Roles(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN)
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.ratingsService.findByTeacher(teacherId);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  findOwnRatings(@CurrentUser() user: AuthenticatedUser) {
    return this.ratingsService.findOwnRatings(user.userId);
  }

  @Patch(':id')
  @Roles(Role.STUDENT)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') ratingId: string,
    @Body() dto: UpdateRatingDto,
  ) {
    return this.ratingsService.updateOwnRating(user.userId, ratingId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.STUDENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') ratingId: string,
  ) {
    return this.ratingsService.deleteOwnRating(user.userId, ratingId);
  }
}
