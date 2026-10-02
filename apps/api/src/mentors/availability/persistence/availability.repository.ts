import { Injectable } from '@nestjs/common';
import { AvailabilityRuleStatus, DayOfWeek } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AvailabilityRule } from '../domain/availability-rule';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByMentorProfileId(
    mentorProfileId: string,
  ): Promise<AvailabilityRule[]> {
    const rows = await this.prisma.availabilityRule.findMany({
      where: { mentorProfileId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async countActiveByMentorProfileId(mentorProfileId: string): Promise<number> {
    return this.prisma.availabilityRule.count({
      where: {
        mentorProfileId,
        status: AvailabilityRuleStatus.ACTIVE,
      },
    });
  }

  async replaceForMentorProfile(
    mentorProfileId: string,
    rules: Array<{
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      timezone: string;
    }>,
  ): Promise<AvailabilityRule[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.availabilityRule.deleteMany({ where: { mentorProfileId } });
      if (rules.length > 0) {
        await tx.availabilityRule.createMany({
          data: rules.map((rule) => ({
            mentorProfileId,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            timezone: rule.timezone,
            status: AvailabilityRuleStatus.ACTIVE,
          })),
        });
      }
    });

    return this.findByMentorProfileId(mentorProfileId);
  }

  async findById(id: string): Promise<AvailabilityRule | null> {
    const row = await this.prisma.availabilityRule.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.availabilityRule.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    mentorProfileId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    timezone: string;
    status: AvailabilityRuleStatus;
    createdAt: Date;
    updatedAt: Date;
  }): AvailabilityRule {
    return {
      id: row.id,
      mentorProfileId: row.mentorProfileId,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      timezone: row.timezone,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
