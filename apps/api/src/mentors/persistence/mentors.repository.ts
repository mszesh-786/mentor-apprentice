import { Injectable } from '@nestjs/common';
import {
  CatalogueStatus,
  ExpertiseStatus,
  TeachingLevel,
  VerificationStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { Language } from '../../languages/domain/language';
import { Skill } from '../../skills/domain/skill';
import {
  CreateMentorExpertiseInput,
  MentorExpertise,
  UpdateMentorExpertiseInput,
} from '../domain/mentor-expertise';
import {
  CreateMentorProfileInput,
  MentorProfile,
  UpdateMentorProfileInput,
} from '../domain/mentor-profile';

const profileInclude = {
  languages: {
    include: { language: true },
  },
  expertise: {
    include: {
      skill: {
        include: { category: true },
      },
    },
  },
} as const;

type SkillRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: CatalogueStatus;
  sortOrder: number;
  category: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sortOrder: number;
  };
};

type ExpertiseRow = {
  id: string;
  mentorProfileId: string;
  skillId: string;
  yearsExperience: number;
  description: string | null;
  teachingLevel: TeachingLevel;
  status: ExpertiseStatus;
  skill: SkillRow;
};

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

  async findExpertiseByMentorAndSkill(
    mentorProfileId: string,
    skillId: string,
  ): Promise<MentorExpertise | null> {
    const row = await this.prisma.mentorExpertise.findUnique({
      where: {
        mentorProfileId_skillId: { mentorProfileId, skillId },
      },
      include: {
        skill: { include: { category: true } },
      },
    });
    return row ? this.toExpertise(row) : null;
  }

  async findExpertiseById(id: string): Promise<MentorExpertise | null> {
    const row = await this.prisma.mentorExpertise.findUnique({
      where: { id },
      include: {
        skill: { include: { category: true } },
      },
    });
    return row ? this.toExpertise(row) : null;
  }

  async createExpertise(
    input: CreateMentorExpertiseInput,
  ): Promise<MentorExpertise> {
    const row = await this.prisma.mentorExpertise.create({
      data: {
        mentorProfileId: input.mentorProfileId,
        skillId: input.skillId,
        yearsExperience: input.yearsExperience,
        description: input.description,
        teachingLevel: input.teachingLevel,
      },
      include: {
        skill: { include: { category: true } },
      },
    });
    return this.toExpertise(row);
  }

  async updateExpertise(
    id: string,
    input: UpdateMentorExpertiseInput,
  ): Promise<MentorExpertise> {
    const row = await this.prisma.mentorExpertise.update({
      where: { id },
      data: {
        yearsExperience: input.yearsExperience,
        description: input.description,
        teachingLevel: input.teachingLevel,
      },
      include: {
        skill: { include: { category: true } },
      },
    });
    return this.toExpertise(row);
  }

  async deleteExpertise(id: string): Promise<void> {
    await this.prisma.mentorExpertise.delete({ where: { id } });
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
    expertise: ExpertiseRow[];
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
      expertise: row.expertise
        .map((entry) => this.toExpertise(entry))
        .sort((left, right) => left.skill.name.localeCompare(right.skill.name)),
      identityVerificationStatus: VerificationStatus.NOT_STARTED,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toExpertise(row: ExpertiseRow): MentorExpertise {
    return {
      id: row.id,
      mentorProfileId: row.mentorProfileId,
      skillId: row.skillId,
      yearsExperience: row.yearsExperience,
      description: row.description,
      teachingLevel: row.teachingLevel,
      status: row.status,
      skill: this.toSkill(row.skill),
    };
  }

  private toSkill(row: SkillRow): Skill {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      status: row.status,
      sortOrder: row.sortOrder,
      category: {
        id: row.category.id,
        slug: row.category.slug,
        name: row.category.name,
        description: row.category.description,
        sortOrder: row.category.sortOrder,
      },
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
