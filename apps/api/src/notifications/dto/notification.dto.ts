import {
  NotificationChannel,
  NotificationRelatedEntityType,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListNotificationsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean;
}

export class NotificationResponseDto {
  id!: string;
  type!: NotificationType;
  channel!: NotificationChannel;
  relatedEntityType!: NotificationRelatedEntityType;
  relatedEntityId!: string;
  title!: string;
  body!: string;
  status!: NotificationStatus;
  createdAt!: string;
  readAt!: string | null;
}

export class UnreadCountResponseDto {
  count!: number;
}
