import {
  NotificationChannel,
  NotificationRelatedEntityType,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';

export type InAppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  relatedEntityType: NotificationRelatedEntityType;
  relatedEntityId: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: Date;
  readAt: Date | null;
};
