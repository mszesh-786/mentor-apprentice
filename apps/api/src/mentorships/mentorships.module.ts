import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';
import { MentorshipsService } from './application/mentorships.service';
import { MentorshipsController } from './mentorships.controller';
import { MentorshipsRepository } from './persistence/mentorships.repository';
import { SessionsContinueController } from './sessions-continue.controller';

@Module({
  imports: [AuthModule, AnalyticsModule, SessionsModule],
  controllers: [MentorshipsController, SessionsContinueController],
  providers: [MentorshipsService, MentorshipsRepository],
  exports: [MentorshipsService],
})
export class MentorshipsModule {}
