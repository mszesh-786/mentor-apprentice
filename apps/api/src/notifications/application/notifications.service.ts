import { Injectable, Logger } from '@nestjs/common';
import { NotificationRelatedEntityType, NotificationType, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { ForbiddenError, NotFoundError } from '../../common/errors/domain-error';
import { NotificationsRepository } from '../persistence/notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async listMine(user: AuthUser, options?: { unreadOnly?: boolean }) {
    this.assertActive(user);
    return this.notificationsRepository.listForUser(user.id, options);
  }

  async getUnreadCount(user: AuthUser): Promise<number> {
    this.assertActive(user);
    return this.notificationsRepository.countUnread(user.id);
  }

  async markRead(user: AuthUser, notificationId: string) {
    this.assertActive(user);
    const updated = await this.notificationsRepository.markRead(
      notificationId,
      user.id,
    );
    if (!updated) {
      throw new NotFoundError('Notification not found');
    }
    return updated;
  }

  async markAllRead(user: AuthUser): Promise<number> {
    this.assertActive(user);
    return this.notificationsRepository.markAllRead(user.id);
  }

  async notifyBookingRequested(input: {
    mentorUserId: string;
    bookingId: string;
    apprenticeDisplayName: string | null;
  }): Promise<void> {
    const name = input.apprenticeDisplayName?.trim() || 'An apprentice';
    await this.safeCreate({
      userId: input.mentorUserId,
      type: NotificationType.BOOKING_REQUESTED,
      relatedEntityType: NotificationRelatedEntityType.BOOKING,
      relatedEntityId: input.bookingId,
      title: 'New booking request',
      body: `${name} requested a session with you.`,
    });
  }

  async notifyBookingAccepted(input: {
    apprenticeUserId: string;
    bookingId: string;
    mentorDisplayName: string | null;
  }): Promise<void> {
    const name = input.mentorDisplayName?.trim() || 'Your mentor';
    await this.safeCreate({
      userId: input.apprenticeUserId,
      type: NotificationType.BOOKING_ACCEPTED,
      relatedEntityType: NotificationRelatedEntityType.BOOKING,
      relatedEntityId: input.bookingId,
      title: 'Booking accepted',
      body: `${name} accepted your booking request.`,
    });
  }

  async notifyBookingDeclined(input: {
    apprenticeUserId: string;
    bookingId: string;
    mentorDisplayName: string | null;
  }): Promise<void> {
    const name = input.mentorDisplayName?.trim() || 'Your mentor';
    await this.safeCreate({
      userId: input.apprenticeUserId,
      type: NotificationType.BOOKING_DECLINED,
      relatedEntityType: NotificationRelatedEntityType.BOOKING,
      relatedEntityId: input.bookingId,
      title: 'Booking declined',
      body: `${name} declined your booking request.`,
    });
  }

  async notifyBookingCancelled(input: {
    recipientUserId: string;
    bookingId: string;
    cancelReason?: string | null;
  }): Promise<void> {
    const reason = input.cancelReason?.trim();
    const suffix =
      reason === 'USER_BLOCKED'
        ? ' A booking between you was cancelled.'
        : reason
          ? ` Reason: ${reason.replace(/_/g, ' ').toLowerCase()}.`
          : '';
    await this.safeCreate({
      userId: input.recipientUserId,
      type: NotificationType.BOOKING_CANCELLED,
      relatedEntityType: NotificationRelatedEntityType.BOOKING,
      relatedEntityId: input.bookingId,
      title: 'Booking cancelled',
      body: `A booking was cancelled.${suffix}`,
    });
  }

  async notifyFeedbackRequested(input: {
    userId: string;
    sessionId: string;
  }): Promise<void> {
    await this.safeCreate({
      userId: input.userId,
      type: NotificationType.FEEDBACK_REQUESTED,
      relatedEntityType: NotificationRelatedEntityType.SESSION,
      relatedEntityId: input.sessionId,
      title: 'How was your session?',
      body: 'Your session is complete. Share quick feedback when you have a moment.',
    });
  }

  private async safeCreate(input: {
    userId: string;
    type: NotificationType;
    relatedEntityType: NotificationRelatedEntityType;
    relatedEntityId: string;
    title: string;
    body: string;
  }): Promise<void> {
    try {
      await this.notificationsRepository.create(input);
    } catch (error) {
      this.logger.warn(
        `Failed to create notification for user ${input.userId}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
