import { Injectable } from '@nestjs/common';
import {
  AvailabilityRuleStatus,
  ExpertiseStatus,
  PublicationStatus,
  TeachingLevel,
  UserStatus,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  DiscoveryMentorCard,
  DiscoveryMentorDetail,
  DiscoverySearchFilters,
} from '../domain/discovery';

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchMentors(
    filters: DiscoverySearchFilters,
  ): Promise<DiscoveryMentorCard[]> {
    const rows = await this.prisma.mentorProfile.findMany({
      where: {
        publicationStatus: PublicationStatus.PUBLISHED,
        user: {
          status: UserStatus.ACTIVE,
          ...(filters.excludeUserIds.length > 0
            ? { id: { notIn: filters.excludeUserIds } }
            : {}),
          verifications: {
            some: {
              type: VerificationType.IDENTITY,
              status: VerificationStatus.VERIFIED,
            },
          },
        },
        availabilityRules: {
          some: { status: AvailabilityRuleStatus.ACTIVE },
        },
        expertise: {
          some: {
            skillId: filters.skillId,
            status: ExpertiseStatus.ACTIVE,
            ...(filters.teachingLevel
              ? { teachingLevel: filters.teachingLevel }
              : {}),
          },
        },
        ...(filters.languageId
          ? {
              languages: {
                some: { languageId: filters.languageId },
              },
            }
          : {}),
      },
      include: {
        user: { select: { displayName: true } },
        languages: {
          include: { language: true },
        },
        expertise: {
          where: {
            skillId: filters.skillId,
            status: ExpertiseStatus.ACTIVE,
          },
          include: { skill: true },
        },
        availabilityRules: {
          where: { status: AvailabilityRuleStatus.ACTIVE },
          select: { id: true },
        },
      },
    });

    const cards = rows
      .map((row) => {
        const matched = row.expertise[0];
        if (!matched) {
          return null;
        }

        const languages = row.languages
          .map((entry) => ({
            id: entry.language.id,
            code: entry.language.code,
            name: entry.language.name,
          }))
          .sort((left, right) => left.name.localeCompare(right.name));

        const matchReasons = this.buildMatchReasons({
          skillName: matched.skill.name,
          teachingLevel: matched.teachingLevel,
          languageName: filters.languageId
            ? languages.find((language) => language.id === filters.languageId)
                ?.name
            : undefined,
          filterTeachingLevel: filters.teachingLevel,
        });

        return {
          id: row.id,
          userId: row.userId,
          displayName: row.user.displayName?.trim() || 'Mentor',
          headline: row.headline,
          generalLocation: row.generalLocation,
          languages,
          expertise: {
            skillId: matched.skillId,
            skillName: matched.skill.name,
            yearsExperience: matched.yearsExperience,
            teachingLevel: matched.teachingLevel,
            description: matched.description,
          },
          hourlyRate: row.hourlyRate?.toFixed(2) ?? null,
          currency: row.currency,
          hasAvailability: row.availabilityRules.length > 0,
          matchReasons,
        } satisfies DiscoveryMentorCard;
      })
      .filter((card): card is DiscoveryMentorCard => card !== null);

    return cards.sort((left, right) => {
      const years =
        right.expertise.yearsExperience - left.expertise.yearsExperience;
      if (years !== 0) {
        return years;
      }
      return left.displayName.localeCompare(right.displayName);
    });
  }

  async findDiscoverableDetail(
    profileId: string,
    excludeUserIds: string[],
  ): Promise<DiscoveryMentorDetail | null> {
    const row = await this.prisma.mentorProfile.findFirst({
      where: {
        id: profileId,
        publicationStatus: PublicationStatus.PUBLISHED,
        user: {
          status: UserStatus.ACTIVE,
          ...(excludeUserIds.length > 0
            ? { id: { notIn: excludeUserIds } }
            : {}),
          verifications: {
            some: {
              type: VerificationType.IDENTITY,
              status: VerificationStatus.VERIFIED,
            },
          },
        },
        availabilityRules: {
          some: { status: AvailabilityRuleStatus.ACTIVE },
        },
        expertise: {
          some: { status: ExpertiseStatus.ACTIVE },
        },
      },
      include: {
        user: { select: { displayName: true } },
        languages: {
          include: { language: true },
        },
        expertise: {
          where: { status: ExpertiseStatus.ACTIVE },
          include: { skill: true },
        },
        availabilityRules: {
          where: { status: AvailabilityRuleStatus.ACTIVE },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      displayName: row.user.displayName?.trim() || 'Mentor',
      headline: row.headline,
      biography: row.biography,
      generalLocation: row.generalLocation,
      timezone: row.timezone,
      languages: row.languages
        .map((entry) => ({
          id: entry.language.id,
          code: entry.language.code,
          name: entry.language.name,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      expertise: row.expertise
        .map((entry) => ({
          skillId: entry.skillId,
          skillName: entry.skill.name,
          yearsExperience: entry.yearsExperience,
          teachingLevel: entry.teachingLevel,
          description: entry.description,
        }))
        .sort((left, right) => left.skillName.localeCompare(right.skillName)),
      identityVerified: true,
      availability: row.availabilityRules.map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        timezone: rule.timezone,
      })),
      hourlyRate: row.hourlyRate?.toFixed(2) ?? null,
      currency: row.currency,
    };
  }

  private buildMatchReasons(input: {
    skillName: string;
    teachingLevel: TeachingLevel;
    languageName?: string;
    filterTeachingLevel?: TeachingLevel;
  }): string[] {
    const reasons = [`Teaches ${input.skillName}`];
    if (input.languageName) {
      reasons.push(`Speaks ${input.languageName}`);
    }
    if (input.filterTeachingLevel) {
      reasons.push(`Teaching level: ${input.teachingLevel}`);
    }
    reasons.push('Identity verified');
    reasons.push('Available for booking');
    return reasons;
  }
}
