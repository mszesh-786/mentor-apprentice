import { TeachingLevel } from '@prisma/client';

export class DiscoveryMentorCardResponseDto {
  id!: string;
  displayName!: string;
  headline!: string | null;
  bioExcerpt!: string | null;
  profilePhotoUrl!: string | null;
  generalLocation!: string | null;
  languages!: Array<{ id: string; code: string; name: string }>;
  expertise!: {
    skillId: string;
    skillName: string;
    categoryName: string;
    yearsExperience: number;
    teachingLevel: TeachingLevel;
    description: string | null;
  };
  hourlyRate!: string | null;
  currency!: string | null;
  hasAvailability!: boolean;
  identityVerified!: true;
  matchReasons!: string[];
  averageRating!: number | null;
  reviewCount!: number;
}

export class DiscoveryMentorDetailResponseDto {
  id!: string;
  userId!: string;
  displayName!: string;
  headline!: string | null;
  biography!: string | null;
  profilePhotoUrl!: string | null;
  generalLocation!: string | null;
  timezone!: string | null;
  languages!: Array<{ id: string; code: string; name: string }>;
  expertise!: Array<{
    skillId: string;
    skillName: string;
    categoryName: string;
    yearsExperience: number;
    teachingLevel: TeachingLevel;
    description: string | null;
  }>;
  identityVerified!: true;
  availability!: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    timezone: string;
  }>;
  hourlyRate!: string | null;
  currency!: string | null;
  averageRating!: number | null;
  reviewCount!: number;
  completedSessionCount!: number;
}

export class DiscoveryMentorReviewResponseDto {
  id!: string;
  rating!: number;
  comment!: string | null;
  reviewerFirstName!: string;
  createdAt!: string;
}

export class DiscoveryMentorReviewPageResponseDto {
  items!: DiscoveryMentorReviewResponseDto[];
  total!: number;
}
