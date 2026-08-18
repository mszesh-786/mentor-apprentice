import { PublicationStatus } from '@prisma/client';
import { LanguageResponseDto } from '../../languages/dto/language-response.dto';

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
  createdAt!: string;
  updatedAt!: string;
}
