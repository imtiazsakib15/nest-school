import { Module } from '@nestjs/common';

import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [StudentsController],
  providers: [StudentsService, RolesGuard, JwtAuthGuard],
})
export class StudentsModule {}
