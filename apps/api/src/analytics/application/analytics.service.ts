import { Injectable } from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import { AnalyticsRepository } from '../persistence/analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async recordSkillSearch(
    actorUserId: string,
    payload: {
      skillId: string;
      languageId?: string;
      teachingLevel?: string;
      resultCount: number;
    },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.SKILL_SEARCH,
      actorUserId,
      payload,
    });
  }

  async recordMentorProfileView(
    actorUserId: string,
    payload: { mentorProfileId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.MENTOR_PROFILE_VIEW,
      actorUserId,
      payload,
    });
  }
}
