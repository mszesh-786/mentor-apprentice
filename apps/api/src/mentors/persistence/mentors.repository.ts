import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateMentorProfileInput,
  MentorProfile,
  UpdateMentorProfileInput,
} from '../domain/mentor-profile';

@Injectable()
export class MentorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<MentorProfile | null> {
    const row = await this.prisma.mentorProfile.findUnique({
      where: { userId },
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
    });
    return this.toDomain(row);
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
