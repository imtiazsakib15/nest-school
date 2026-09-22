import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { Role } from '../generated/prisma/enums.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';

import { UpdateStudentProfileDto } from './dto/update-student-profile.dto.js';
import { StudentsService } from './students.service.js';

@Controller({
  path: 'students',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.TEACHER)
  findAll() {
    return this.studentsService.findAll();
  }

  @Get('me')
  @Roles(Role.STUDENT)
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.findByUserId(user.userId);
  }

  @Patch('me')
  @Roles(Role.STUDENT)
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentsService.updateOwnProfile(user.userId, dto);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateProfile(id, dto);
  }
}
