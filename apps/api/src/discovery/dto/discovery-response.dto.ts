import { TeachingLevel } from '@prisma/client';

export class DiscoveryMentorCardResponseDto {
  id!: string;
  displayName!: string;
  headline!: string | null;
  generalLocation!: string | null;
  languages!: Array<{ id: string; code: string; name: string }>;
  expertise!: {
    skillId: string;
    skillName: string;
    yearsExperience: number;
    teachingLevel: TeachingLevel;
    description: string | null;
  };
  hourlyRate!: string | null;
  currency!: string | null;
  hasAvailability!: boolean;
  identityVerified!: true;
  matchReasons!: string[];
}

export class DiscoveryMentorDetailResponseDto {
  id!: string;
  userId!: string;
  displayName!: string;
  headline!: string | null;
  biography!: string | null;
  generalLocation!: string | null;
  timezone!: string | null;
  languages!: Array<{ id: string; code: string; name: string }>;
  expertise!: Array<{
    skillId: string;
    skillName: string;
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
}
