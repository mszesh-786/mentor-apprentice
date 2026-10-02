import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MentorshipStatus } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MentorshipsService } from './application/mentorships.service';
import {
  MentorshipResponseDto,
  UpsertMentorshipGoalDto,
} from './dto/mentorship.dto';
import { toMentorshipResponse } from './mappers/mentorship.mapper';

@Controller('mentorships')
@UseGuards(JwtAuthGuard)
export class MentorshipsController {
  constructor(private readonly mentorshipsService: MentorshipsService) {}

  @Get('me')
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: MentorshipStatus,
  ): Promise<MentorshipResponseDto[]> {
    const relationships = await this.mentorshipsService.listMine(user, status);
    return relationships.map(toMentorshipResponse);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.getById(user, id);
    return toMentorshipResponse(relationship);
  }

  @Get(':id/bookings')
  async listBookings(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.mentorshipsService.listBookings(user, id);
  }

  @Get(':id/sessions')
  async listSessions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.mentorshipsService.listSessions(user, id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  async pause(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.pause(user, id);
    return toMentorshipResponse(relationship);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.resume(user, id);
    return toMentorshipResponse(relationship);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.complete(user, id);
    return toMentorshipResponse(relationship);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  async end(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.end(user, id);
    return toMentorshipResponse(relationship);
  }

  @Put(':id/goals')
  async upsertGoal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertMentorshipGoalDto,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.upsertGoal(
      user,
      id,
      dto,
    );
    return toMentorshipResponse(relationship);
  }

  @Post(':id/goals/:goalId/achieve')
  @HttpCode(HttpStatus.OK)
  async achieveGoal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('goalId') goalId: string,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.achieveGoal(
      user,
      id,
      goalId,
    );
    return toMentorshipResponse(relationship);
  }

  @Post(':id/goals/:goalId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelGoal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('goalId') goalId: string,
  ): Promise<MentorshipResponseDto> {
    const relationship = await this.mentorshipsService.cancelGoal(
      user,
      id,
      goalId,
    );
    return toMentorshipResponse(relationship);
  }
}
