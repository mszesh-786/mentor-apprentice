import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MentorshipsService } from './application/mentorships.service';
import {
  ContinueMentorshipDto,
  MentorshipResponseDto,
} from './dto/mentorship.dto';
import { toMentorshipResponse } from './mappers/mentorship.mapper';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsContinueController {
  constructor(private readonly mentorshipsService: MentorshipsService) {}

  @Post(':id/continue')
  @HttpCode(HttpStatus.CREATED)
  async continue(
    @CurrentUser() user: AuthUser,
    @Param('id') sessionId: string,
    @Body() dto: ContinueMentorshipDto,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.continueFromSession(
      user,
      sessionId,
      dto,
    );
    return toMentorshipResponse(relationship);
  }
}
