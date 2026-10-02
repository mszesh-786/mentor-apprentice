import { Injectable } from '@nestjs/common';
import {
  AvailabilityRuleStatus,
  ExpertiseStatus,
  Prisma,
  PublicationStatus,
  SessionFeedbackRole,
  SessionStatus,
  TeachingLevel,
  UserStatus,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  DiscoveryMentorCard,
  DiscoveryMentorDetail,
  DiscoveryMentorReviewPage,
  DiscoverySearchFilters,
  MentorRatingStats,
} from '../domain/discovery';

const SEARCH_RESULT_LIMIT = 50;
const BIO_EXCERPT_LENGTH = 160;

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchMentors(
    filters: DiscoverySearchFilters,
  ): Promise<DiscoveryMentorCard[]> {
    const q = filters.q?.trim();
    const expertiseFilter: Prisma.MentorExpertiseWhereInput = {
      status: ExpertiseStatus.ACTIVE,
      ...(filters.skillId ? { skillId: filters.skillId } : {}),
      ...(filters.teachingLevel
        ? { teachingLevel: filters.teachingLevel }
        : {}),
      ...(filters.categoryId
        ? { skill: { categoryId: filters.categoryId } }
        : {}),
    };

    const rows = await this.prisma.mentorProfile.findMany({
      where: {
        AND: [
          this.discoverableWhere(filters.excludeUserIds),
          { expertise: { some: expertiseFilter } },
          filters.languageId
            ? { languages: { some: { languageId: filters.languageId } } }
            : {},
          q ? this.textSearchWhere(q) : {},
        ],
      },
      include: {
        user: { select: { displayName: true } },
        languages: {
          include: { language: true },
        },
        expertise: {
          where: expertiseFilter,
          include: { skill: { include: { category: true } } },
          orderBy: { yearsExperience: 'desc' },
        },
        availabilityRules: {
          where: { status: AvailabilityRuleStatus.ACTIVE },
          select: { id: true },
        },
      },
      take: SEARCH_RESULT_LIMIT,
    });

    const stats = await this.findRatingStats(rows.map((row) => row.id));
    const qLower = q?.toLowerCase();

    const cards = rows
      .map((row) => {
        const matched =
          (qLower
            ? row.expertise.find(
                (entry) =>
                  entry.skill.name.toLowerCase().includes(qLower) ||
                  entry.skill.category.name.toLowerCase().includes(qLower),
              )
            : undefined) ?? row.expertise[0];
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
          bioExcerpt: toExcerpt(row.biography),
          profilePhotoUrl: row.profilePhotoUrl,
          generalLocation: row.generalLocation,
          languages,
          expertise: {
            skillId: matched.skillId,
            skillName: matched.skill.name,
            categoryName: matched.skill.category.name,
            yearsExperience: matched.yearsExperience,
            teachingLevel: matched.teachingLevel,
            description: matched.description,
          },
          hourlyRate: row.hourlyRate?.toFixed(2) ?? null,
          currency: row.currency,
          hasAvailability: row.availabilityRules.length > 0,
          matchReasons,
          ...(stats.get(row.id) ?? { averageRating: null, reviewCount: 0 }),
        } satisfies DiscoveryMentorCard;
      })
      .filter((card): card is DiscoveryMentorCard => card !== null);

    if (filters.skillId) {
      return cards.sort((left, right) => {
        const years =
          right.expertise.yearsExperience - left.expertise.yearsExperience;
        if (years !== 0) {
          return years;
        }
        return left.displayName.localeCompare(right.displayName);
      });
    }

    return cards.sort((left, right) => {
      const rating = weightedRating(right) - weightedRating(left);
      if (rating !== 0) {
        return rating;
      }
      const count = right.reviewCount - left.reviewCount;
      if (count !== 0) {
        return count;
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
        AND: [
          { id: profileId },
          this.discoverableWhere(excludeUserIds),
          { expertise: { some: { status: ExpertiseStatus.ACTIVE } } },
        ],
      },
      include: {
        user: { select: { displayName: true } },
        languages: {
          include: { language: true },
        },
        expertise: {
          where: { status: ExpertiseStatus.ACTIVE },
          include: { skill: { include: { category: true } } },
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

    const [stats, completedSessionCount] = await Promise.all([
      this.findRatingStats([row.id]),
      this.prisma.session.count({
        where: {
          status: SessionStatus.COMPLETED,
          booking: { mentorProfileId: row.id },
        },
      }),
    ]);

    return {
      id: row.id,
      userId: row.userId,
      displayName: row.user.displayName?.trim() || 'Mentor',
      headline: row.headline,
      biography: row.biography,
      profilePhotoUrl: row.profilePhotoUrl,
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
          categoryName: entry.skill.category.name,
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
      completedSessionCount,
      ...(stats.get(row.id) ?? { averageRating: null, reviewCount: 0 }),
    };
  }

  async findMentorReviews(
    profileId: string,
    page: { offset: number; limit: number },
  ): Promise<DiscoveryMentorReviewPage> {
    const where = this.reviewWhere([profileId]);
    const [rows, total] = await Promise.all([
      this.prisma.sessionFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.offset,
        take: page.limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { displayName: true } },
        },
      }),
      this.prisma.sessionFeedback.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        rating: row.rating ?? 0,
        comment: row.comment,
        reviewerFirstName: firstName(row.author.displayName),
        createdAt: row.createdAt,
      })),
      total,
    };
  }

  private async findRatingStats(
    profileIds: string[],
  ): Promise<Map<string, MentorRatingStats>> {
    const stats = new Map<string, MentorRatingStats>();
    if (profileIds.length === 0) {
      return stats;
    }

    const rows = await this.prisma.sessionFeedback.findMany({
      where: this.reviewWhere(profileIds),
      select: {
        rating: true,
        session: {
          select: { booking: { select: { mentorProfileId: true } } },
        },
      },
    });

    const totals = new Map<string, { sum: number; count: number }>();
    for (const row of rows) {
      if (row.rating === null) continue;
      const id = row.session.booking.mentorProfileId;
      const entry = totals.get(id) ?? { sum: 0, count: 0 };
      entry.sum += row.rating;
      entry.count += 1;
      totals.set(id, entry);
    }

    for (const [id, { sum, count }] of totals) {
      stats.set(id, {
        averageRating: Math.round((sum / count) * 10) / 10,
        reviewCount: count,
      });
    }
    return stats;
  }

  private reviewWhere(profileIds: string[]): Prisma.SessionFeedbackWhereInput {
    return {
      role: SessionFeedbackRole.APPRENTICE,
      rating: { not: null },
      session: { booking: { mentorProfileId: { in: profileIds } } },
    };
  }

  private discoverableWhere(
    excludeUserIds: string[],
  ): Prisma.MentorProfileWhereInput {
    return {
      publicationStatus: PublicationStatus.PUBLISHED,
      user: {
        status: UserStatus.ACTIVE,
        ...(excludeUserIds.length > 0 ? { id: { notIn: excludeUserIds } } : {}),
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
    };
  }

  private textSearchWhere(q: string): Prisma.MentorProfileWhereInput {
    const contains = { contains: q, mode: Prisma.QueryMode.insensitive };
    return {
      OR: [
        { user: { displayName: contains } },
        { headline: contains },
        { biography: contains },
        {
          expertise: {
            some: {
              status: ExpertiseStatus.ACTIVE,
              OR: [
                { skill: { name: contains } },
                { skill: { category: { name: contains } } },
              ],
            },
          },
        },
      ],
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

const RATING_PRIOR = 4;
const RATING_PRIOR_WEIGHT = 3;

/** Pulls averages from few reviews toward a neutral prior so one 5★ doesn't outrank many 4.8★. */
function weightedRating(stats: MentorRatingStats): number {
  if (stats.averageRating === null || stats.reviewCount === 0) return 0;
  return (
    (stats.averageRating * stats.reviewCount +
      RATING_PRIOR * RATING_PRIOR_WEIGHT) /
    (stats.reviewCount + RATING_PRIOR_WEIGHT)
  );
}

function toExcerpt(text: string | null): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  if (trimmed.length <= BIO_EXCERPT_LENGTH) return trimmed;
  const cut = trimmed.slice(0, BIO_EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function firstName(displayName: string | null): string {
  return displayName?.trim().split(/\s+/)[0] || 'Apprentice';
}
