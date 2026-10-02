import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ApprenticeProfile,
  CreateApprenticeProfileInput,
  UpdateApprenticeProfileInput,
} from '../domain/apprentice-profile';

@Injectable()
export class ApprenticesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<ApprenticeProfile | null> {
    const row = await this.prisma.apprenticeProfile.findUnique({
      where: { userId },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(
    input: CreateApprenticeProfileInput,
  ): Promise<ApprenticeProfile> {
    const row = await this.prisma.apprenticeProfile.create({
      data: {
        userId: input.userId,
        shortBio: input.shortBio,
        generalLocation: input.generalLocation,
      },
    });
    return this.toDomain(row);
  }

  async update(
    userId: string,
    input: UpdateApprenticeProfileInput,
  ): Promise<ApprenticeProfile> {
    const row = await this.prisma.apprenticeProfile.update({
      where: { userId },
      data: {
        shortBio: input.shortBio,
        generalLocation: input.generalLocation,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    userId: string;
    shortBio: string | null;
    generalLocation: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ApprenticeProfile {
    return {
      id: row.id,
      userId: row.userId,
      shortBio: row.shortBio,
      generalLocation: row.generalLocation,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
