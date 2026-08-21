import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SessionsService } from './application/sessions.service';
import { SessionResponseDto } from './dto/session.dto';
import { toSessionResponse } from './mappers/session.mapper';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsSessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':id/session')
  async getSessionForBooking(
    @CurrentUser() user: AuthUser,
    @Param('id') bookingId: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.getByBookingId(user, bookingId);
    return toSessionResponse(session);
  }
}
