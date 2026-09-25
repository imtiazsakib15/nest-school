import { Module } from '@nestjs/common';

import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
