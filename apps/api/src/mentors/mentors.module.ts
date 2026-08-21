import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LanguagesModule } from '../languages/languages.module';
import { SkillsModule } from '../skills/skills.module';
import { UsersModule } from '../users/users.module';
import { VerificationModule } from '../verification/verification.module';
import { AvailabilityService } from './availability/application/availability.service';
import { AvailabilityRepository } from './availability/persistence/availability.repository';
import { AvailabilityExceptionRepository } from './availability/persistence/availability-exception.repository';
import { PublicationService } from './publication/application/publication.service';
import { MentorsService } from './application/mentors.service';
import { MentorsController } from './mentors.controller';
import { MentorsRepository } from './persistence/mentors.repository';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    LanguagesModule,
    SkillsModule,
    VerificationModule,
  ],
  controllers: [MentorsController],
  providers: [
    MentorsService,
    MentorsRepository,
    AvailabilityService,
    AvailabilityRepository,
    AvailabilityExceptionRepository,
    PublicationService,
  ],
  exports: [
    MentorsService,
    MentorsRepository,
    AvailabilityService,
    PublicationService,
  ],
})
export class MentorsModule {}
