import { Module } from '@nestjs/common';

import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, RolesGuard],
})
export class StudentsModule {}
