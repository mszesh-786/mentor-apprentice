import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LanguagesModule } from '../languages/languages.module';
import { SkillsModule } from '../skills/skills.module';
import { UsersModule } from '../users/users.module';
import { MentorsService } from './application/mentors.service';
import { MentorsController } from './mentors.controller';
import { MentorsRepository } from './persistence/mentors.repository';

@Module({
  imports: [AuthModule, UsersModule, LanguagesModule, SkillsModule],
  controllers: [MentorsController],
  providers: [MentorsService, MentorsRepository],
  exports: [MentorsService],
})
export class MentorsModule {}
