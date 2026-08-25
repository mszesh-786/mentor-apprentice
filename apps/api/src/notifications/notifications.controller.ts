import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './application/notifications.service';
import {
  ListNotificationsQueryDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
} from './dto/notification.dto';
import { toNotificationResponse } from './mappers/notification.mapper';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsService.listMine(user, {
      unreadOnly: query.unreadOnly,
    });
    return notifications.map(toNotificationResponse);
  }

  @Get('me/unread-count')
  async unreadCount(
    @CurrentUser() user: AuthUser,
  ): Promise<UnreadCountResponseDto> {
    const count = await this.notificationsService.getUnreadCount(user);
    return { count };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.markRead(user, id);
    return toNotificationResponse(notification);
  }

  @Post('me/read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(
    @CurrentUser() user: AuthUser,
  ): Promise<{ updated: number }> {
    const updated = await this.notificationsService.markAllRead(user);
    return { updated };
  }
}
