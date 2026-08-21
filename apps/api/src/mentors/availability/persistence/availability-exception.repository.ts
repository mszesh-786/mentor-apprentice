import { Injectable } from '@nestjs/common';
import { AvailabilityExceptionType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  AvailabilityException,
  AvailabilityExceptionInput,
} from '../domain/availability-exception';

@Injectable()
export class AvailabilityExceptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByMentorProfileId(
    mentorProfileId: string,
  ): Promise<AvailabilityException[]> {
    const rows = await this.prisma.availabilityException.findMany({
      where: { mentorProfileId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByMentorAndDateRange(
    mentorProfileId: string,
    fromDate: string,
    toDate: string,
  ): Promise<AvailabilityException[]> {
    const rows = await this.prisma.availabilityException.findMany({
      where: {
        mentorProfileId,
        date: { gte: fromDate, lte: toDate },
        type: AvailabilityExceptionType.UNAVAILABLE,
      },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(
    mentorProfileId: string,
    input: AvailabilityExceptionInput,
  ): Promise<AvailabilityException> {
    const row = await this.prisma.availabilityException.create({
      data: {
        mentorProfileId,
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        type: AvailabilityExceptionType.UNAVAILABLE,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<AvailabilityException | null> {
    const row = await this.prisma.availabilityException.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.availabilityException.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    mentorProfileId: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    type: AvailabilityExceptionType;
    createdAt: Date;
    updatedAt: Date;
  }): AvailabilityException {
    return {
      id: row.id,
      mentorProfileId: row.mentorProfileId,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      type: row.type,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
