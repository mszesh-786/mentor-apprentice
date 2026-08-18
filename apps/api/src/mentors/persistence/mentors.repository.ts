import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { Language } from '../../languages/domain/language';
import {
  CreateMentorProfileInput,
  MentorProfile,
  UpdateMentorProfileInput,
} from '../domain/mentor-profile';

const profileInclude = {
  languages: {
    include: { language: true },
  },
} as const;

@Injectable()
export class MentorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<MentorProfile | null> {
    const row = await this.prisma.mentorProfile.findUnique({
      where: { userId },
      include: profileInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateMentorProfileInput): Promise<MentorProfile> {
    const row = await this.prisma.mentorProfile.create({
      data: {
        userId: input.userId,
        headline: input.headline,
        biography: input.biography,
        generalLocation: input.generalLocation,
        timezone: input.timezone,
        profilePhotoUrl: input.profilePhotoUrl,
        hourlyRate:
          input.hourlyRate === undefined
            ? undefined
            : new Decimal(input.hourlyRate),
        currency: input.currency,
      },
      include: profileInclude,
    });
    return this.toDomain(row);
  }

  async update(
    userId: string,
    input: UpdateMentorProfileInput,
  ): Promise<MentorProfile> {
    const row = await this.prisma.mentorProfile.update({
      where: { userId },
      data: {
        headline: input.headline,
        biography: input.biography,
        generalLocation: input.generalLocation,
        timezone: input.timezone,
        profilePhotoUrl: input.profilePhotoUrl,
        hourlyRate:
          input.hourlyRate === undefined
            ? undefined
            : input.hourlyRate === null
              ? null
              : new Decimal(input.hourlyRate),
        currency: input.currency,
      },
      include: profileInclude,
    });
    return this.toDomain(row);
  }

  async replaceLanguages(
    mentorProfileId: string,
    languageIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mentorLanguage.deleteMany({ where: { mentorProfileId } }),
      ...(languageIds.length > 0
        ? [
            this.prisma.mentorLanguage.createMany({
              data: languageIds.map((languageId) => ({
                mentorProfileId,
                languageId,
              })),
            }),
          ]
        : []),
    ]);
  }

  private toDomain(row: {
    id: string;
    userId: string;
    headline: string | null;
    biography: string | null;
    generalLocation: string | null;
    timezone: string | null;
    profilePhotoUrl: string | null;
    hourlyRate: Decimal | null;
    currency: string | null;
    publicationStatus: MentorProfile['publicationStatus'];
    createdAt: Date;
    updatedAt: Date;
    languages: Array<{
      language: {
        id: string;
        code: string;
        name: string;
        sortOrder: number;
      };
    }>;
  }): MentorProfile {
    return {
      id: row.id,
      userId: row.userId,
      headline: row.headline,
      biography: row.biography,
      generalLocation: row.generalLocation,
      timezone: row.timezone,
      profilePhotoUrl: row.profilePhotoUrl,
      hourlyRate: row.hourlyRate?.toFixed(2) ?? null,
      currency: row.currency,
      publicationStatus: row.publicationStatus,
      languages: row.languages
        .map((entry) => this.toLanguage(entry.language))
        .sort(
          (left, right) =>
            left.sortOrder - right.sortOrder ||
            left.name.localeCompare(right.name),
        ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toLanguage(row: {
    id: string;
    code: string;
    name: string;
    sortOrder: number;
  }): Language {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      sortOrder: row.sortOrder,
    };
  }
}
