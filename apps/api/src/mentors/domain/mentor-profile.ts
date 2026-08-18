import { PublicationStatus } from '@prisma/client';
import { Language } from '../../languages/domain/language';

export type MentorProfile = {
  id: string;
  userId: string;
  headline: string | null;
  biography: string | null;
  generalLocation: string | null;
  timezone: string | null;
  profilePhotoUrl: string | null;
  hourlyRate: string | null;
  currency: string | null;
  publicationStatus: PublicationStatus;
  languages: Language[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMentorProfileInput = {
  userId: string;
  headline?: string;
  biography?: string;
  generalLocation?: string;
  timezone?: string;
  profilePhotoUrl?: string;
  hourlyRate?: number;
  currency?: string;
};

export type UpdateMentorProfileInput = {
  headline?: string;
  biography?: string;
  generalLocation?: string;
  timezone?: string;
  profilePhotoUrl?: string;
  hourlyRate?: number | null;
  currency?: string | null;
};
