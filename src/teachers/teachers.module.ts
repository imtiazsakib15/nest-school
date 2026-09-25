import { Module } from '@nestjs/common';

import { TeachersController } from './teachers.controller.js';
import { TeachersService } from './teachers.service.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [TeachersController],
  providers: [TeachersService],
})
export class TeachersModule {}
