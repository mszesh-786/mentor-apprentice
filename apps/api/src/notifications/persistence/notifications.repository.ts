import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationRelatedEntityType,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InAppNotification } from '../domain/notification';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    userId: string;
    type: NotificationType;
    relatedEntityType: NotificationRelatedEntityType;
    relatedEntityId: string;
    title: string;
    body: string;
  }): Promise<InAppNotification> {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: NotificationChannel.IN_APP,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        title: input.title,
        body: input.body,
      },
    });
    return this.toDomain(row);
  }

  async listForUser(
    userId: string,
    options?: { unreadOnly?: boolean },
  ): Promise<InAppNotification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly ? { status: NotificationStatus.UNREAD } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<InAppNotification | null> {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    return row ? this.toDomain(row) : null;
  }

  async markRead(id: string, userId: string): Promise<InAppNotification | null> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    if (existing.status === NotificationStatus.READ) {
      return existing;
    }
    const row = await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
    return this.toDomain(row);
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: NotificationStatus.UNREAD },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
    return result.count;
  }

  private toDomain(row: {
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
  }): InAppNotification {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      channel: row.channel,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      title: row.title,
      body: row.body,
      status: row.status,
      createdAt: row.createdAt,
      readAt: row.readAt,
    };
  }
}
