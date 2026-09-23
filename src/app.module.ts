import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

import configuration from './config/configuration.js';
import { envValidationSchema } from './config/env.validation.js';
import { StudentsModule } from './students/students.module.js';
import { TeachersModule } from './teachers/teachers.module.js';
import { RatingsModule } from './ratings/ratings.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    TeachersModule,
    RatingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
