import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { SessionsService } from './application/sessions.service';
import { BookingsSessionsController } from './bookings-sessions.controller';
import { SessionsRepository } from './persistence/sessions.repository';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [AuthModule, AnalyticsModule, FeedbackModule],
  controllers: [SessionsController, BookingsSessionsController],
  providers: [SessionsService, SessionsRepository],
  exports: [SessionsService, SessionsRepository],
})
export class SessionsModule {}
