import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { LanguagesModule } from './languages/languages.module';
import { MentorsModule } from './mentors/mentors.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    LanguagesModule,
    SkillsModule,
    VerificationModule,
    MentorsModule,
  ],
})
export class AppModule {}
