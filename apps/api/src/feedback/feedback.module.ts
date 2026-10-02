import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeedbackService } from './application/feedback.service';
import {
  ProductFeedbackController,
  SessionFeedbackController,
} from './feedback.controller';
import { FeedbackRepository } from './persistence/feedback.repository';

@Module({
  imports: [AuthModule],
  controllers: [SessionFeedbackController, ProductFeedbackController],
  providers: [FeedbackService, FeedbackRepository],
  exports: [FeedbackService],
})
export class FeedbackModule {}
