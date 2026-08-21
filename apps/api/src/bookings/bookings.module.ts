import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ApprenticesModule } from '../apprentices/apprentices.module';
import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { MentorsModule } from '../mentors/mentors.module';
import { SessionsModule } from '../sessions/sessions.module';
import { SkillsModule } from '../skills/skills.module';
import { UsersModule } from '../users/users.module';
import { VerificationModule } from '../verification/verification.module';
import { BookingsService } from './application/bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './persistence/bookings.repository';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ApprenticesModule,
    MentorsModule,
    SkillsModule,
    VerificationModule,
    BlocksModule,
    AnalyticsModule,
    forwardRef(() => SessionsModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService],
})
export class BookingsModule {}
