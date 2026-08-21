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

  async recordBookingRequested(
    actorUserId: string,
    payload: {
      bookingId: string;
      mentorProfileId: string;
      skillId: string;
    },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.BOOKING_REQUESTED,
      actorUserId,
      payload,
    });
  }

  async recordBookingAccepted(
    actorUserId: string,
    payload: { bookingId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.BOOKING_ACCEPTED,
      actorUserId,
      payload,
    });
  }

  async recordBookingDeclined(
    actorUserId: string,
    payload: { bookingId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.BOOKING_DECLINED,
      actorUserId,
      payload,
    });
  }

  async recordBookingCancelled(
    actorUserId: string,
    payload: { bookingId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.BOOKING_CANCELLED,
      actorUserId,
      payload,
    });
  }

  async recordSessionJoined(
    actorUserId: string,
    payload: { sessionId: string; bookingId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.SESSION_JOINED,
      actorUserId,
      payload,
    });
  }

  async recordSessionCompleted(
    actorUserId: string,
    payload: { sessionId: string; bookingId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.SESSION_COMPLETED,
      actorUserId,
      payload,
    });
  }

  async recordSessionNoShow(
    actorUserId: string,
    payload: {
      sessionId: string;
      bookingId: string;
      absentUserId: string;
    },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.SESSION_NO_SHOW,
      actorUserId,
      payload,
    });
  }

  async recordSessionTechFailure(
    actorUserId: string,
    payload: { sessionId: string; bookingId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.SESSION_TECH_FAILURE,
      actorUserId,
      payload,
    });
  }

  async recordSessionCancelled(
    actorUserId: string | null,
    payload: { sessionId: string; bookingId: string },
  ): Promise<void> {
    await this.analyticsRepository.create({
      type: AnalyticsEventType.SESSION_CANCELLED,
      actorUserId,
      payload,
    });
  }
}
