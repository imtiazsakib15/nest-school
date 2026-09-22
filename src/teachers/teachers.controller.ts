import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { Role } from '../generated/prisma/enums.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto.js';
import { TeachersService } from './teachers.service.js';

@Controller({
  path: 'teachers',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN)
  findAll() {
    return this.teachersService.findAll();
  }

  @Get('me')
  @Roles(Role.TEACHER)
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.findByUserId(user.userId);
  }

  @Patch('me')
  @Roles(Role.TEACHER)
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTeacherProfileDto,
  ) {
    return this.teachersService.updateOwnProfile(user.userId, dto);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTeacherProfileDto) {
    return this.teachersService.updateProfile(id, dto);
  }
}
