import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsInt } from 'class-validator';
import type { AuthUser } from '../auth/auth-user';
import { BookingsService } from '../bookings/application/bookings.service';
import { AvailabilitySlotResponseDto } from '../bookings/dto/booking.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ALLOWED_DURATIONS_MINUTES } from '../common/scheduling/scheduling';
import { DiscoveryService } from './application/discovery.service';
import {
  DiscoveryMentorCardResponseDto,
  DiscoveryMentorDetailResponseDto,
} from './dto/discovery-response.dto';
import { DiscoverySearchQueryDto } from './dto/discovery-search-query.dto';
import {
  toDiscoveryMentorCardResponse,
  toDiscoveryMentorDetailResponse,
} from './mappers/discovery.mapper';

class DiscoverySlotsQueryDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @Type(() => Number)
  @IsInt()
  @IsIn([...ALLOWED_DURATIONS_MINUTES])
  durationMinutes!: number;
}

@Controller('discovery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.APPRENTICE)
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('mentors')
  async searchMentors(
    @CurrentUser() user: AuthUser,
    @Query() query: DiscoverySearchQueryDto,
  ): Promise<DiscoveryMentorCardResponseDto[]> {
    const results = await this.discoveryService.searchMentors(user, {
      skillId: query.skillId,
      languageId: query.languageId,
      teachingLevel: query.teachingLevel,
    });
    return results.map(toDiscoveryMentorCardResponse);
  }

  @Get('mentors/:profileId/slots')
  async getMentorSlots(
    @CurrentUser() user: AuthUser,
    @Param('profileId') profileId: string,
    @Query() query: DiscoverySlotsQueryDto,
  ): Promise<AvailabilitySlotResponseDto[]> {
    return this.bookingsService.listSlots(user, profileId, {
      from: query.from,
      to: query.to,
      durationMinutes: query.durationMinutes,
    });
  }

  @Get('mentors/:profileId')
  async getMentorDetail(
    @CurrentUser() user: AuthUser,
    @Param('profileId') profileId: string,
  ): Promise<DiscoveryMentorDetailResponseDto> {
    const detail = await this.discoveryService.getMentorDetail(user, profileId);
    return toDiscoveryMentorDetailResponse(detail);
  }
}
