import { TeachingLevel } from '@prisma/client';

export type DiscoverySearchFilters = {
  skillId?: string;
  categoryId?: string;
  q?: string;
  languageId?: string;
  teachingLevel?: TeachingLevel;
  excludeUserIds: string[];
};

export type MentorRatingStats = {
  averageRating: number | null;
  reviewCount: number;
};

export type DiscoveryMentorCard = {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bioExcerpt: string | null;
  profilePhotoUrl: string | null;
  generalLocation: string | null;
  languages: Array<{ id: string; code: string; name: string }>;
  expertise: {
    skillId: string;
    skillName: string;
    categoryName: string;
    yearsExperience: number;
    teachingLevel: TeachingLevel;
    description: string | null;
  };
  hourlyRate: string | null;
  currency: string | null;
  hasAvailability: boolean;
  matchReasons: string[];
} & MentorRatingStats;

export type DiscoveryMentorDetail = {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  biography: string | null;
  profilePhotoUrl: string | null;
  generalLocation: string | null;
  timezone: string | null;
  languages: Array<{ id: string; code: string; name: string }>;
  expertise: Array<{
    skillId: string;
    skillName: string;
    categoryName: string;
    yearsExperience: number;
    teachingLevel: TeachingLevel;
    description: string | null;
  }>;
  identityVerified: true;
  availability: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    timezone: string;
  }>;
  hourlyRate: string | null;
  currency: string | null;
  completedSessionCount: number;
} & MentorRatingStats;

export type DiscoveryMentorReview = {
  id: string;
  rating: number;
  comment: string | null;
  reviewerFirstName: string;
  createdAt: Date;
};

export type DiscoveryMentorReviewPage = {
  items: DiscoveryMentorReview[];
  total: number;
};
