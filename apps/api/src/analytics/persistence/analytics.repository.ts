import { Injectable } from '@nestjs/common';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    type: AnalyticsEventType;
    actorUserId?: string;
    payload: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        type: input.type,
        actorUserId: input.actorUserId,
        payload: input.payload,
      },
    });
  }
}
