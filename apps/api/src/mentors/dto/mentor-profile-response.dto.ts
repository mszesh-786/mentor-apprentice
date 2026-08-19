import { PublicationStatus, VerificationStatus } from '@prisma/client';
import { LanguageResponseDto } from '../../languages/dto/language-response.dto';
import { MentorExpertiseResponseDto } from './mentor-expertise-response.dto';

export class MentorProfileResponseDto {
  id!: string;
  userId!: string;
  headline!: string | null;
  biography!: string | null;
  generalLocation!: string | null;
  timezone!: string | null;
  profilePhotoUrl!: string | null;
  hourlyRate!: string | null;
  currency!: string | null;
  publicationStatus!: PublicationStatus;
  languages!: LanguageResponseDto[];
  expertise!: MentorExpertiseResponseDto[];
  identityVerification!: { status: VerificationStatus };
  hasAvailability!: boolean;
  createdAt!: string;
  updatedAt!: string;
}
