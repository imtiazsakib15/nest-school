import { Module } from '@nestjs/common';

import { RatingsController } from './ratings.controller.js';
import { RatingsService } from './ratings.service.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
