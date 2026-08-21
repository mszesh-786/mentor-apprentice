import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { ApprenticesModule } from './apprentices/apprentices.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { DatabaseModule } from './database/database.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { LanguagesModule } from './languages/languages.module';
import { MentorsModule } from './mentors/mentors.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    LanguagesModule,
    SkillsModule,
    VerificationModule,
    MentorsModule,
    ApprenticesModule,
    BlocksModule,
    AnalyticsModule,
    DiscoveryModule,
    BookingsModule,
  ],
})
export class AppModule {}
