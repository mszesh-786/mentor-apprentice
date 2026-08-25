import { InAppNotification } from '../domain/notification';
import { NotificationResponseDto } from '../dto/notification.dto';

export function toNotificationResponse(
  notification: InAppNotification,
): NotificationResponseDto {
  return {
    id: notification.id,
    type: notification.type,
    channel: notification.channel,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    title: notification.title,
    body: notification.body,
    status: notification.status,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
}
