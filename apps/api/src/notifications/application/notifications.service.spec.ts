import {
  NotificationChannel,
  NotificationRelatedEntityType,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';
import { NotificationsRepository } from '../persistence/notifications.repository';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let repository: jest.Mocked<NotificationsRepository>;
  let service: NotificationsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      listForUser: jest.fn(),
      countUnread: jest.fn(),
      findByIdForUser: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationsRepository>;
    service = new NotificationsService(repository);
  });

  it('creates booking requested notification without throwing', async () => {
    repository.create.mockResolvedValue({
      id: 'notification-1',
      userId: 'mentor-user',
      type: NotificationType.BOOKING_REQUESTED,
      channel: NotificationChannel.IN_APP,
      relatedEntityType: NotificationRelatedEntityType.BOOKING,
      relatedEntityId: 'booking-1',
      title: 'New booking request',
      body: 'Alex requested a session with you.',
      status: NotificationStatus.UNREAD,
      createdAt: new Date(),
      readAt: null,
    });

    await expect(
      service.notifyBookingRequested({
        mentorUserId: 'mentor-user',
        bookingId: 'booking-1',
        apprenticeDisplayName: 'Alex',
      }),
    ).resolves.toBeUndefined();

    expect(repository.create).toHaveBeenCalled();
  });
});
