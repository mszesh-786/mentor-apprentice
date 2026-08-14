import { PublicationStatus } from '@prisma/client';

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
  createdAt!: string;
  updatedAt!: string;
}
