import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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

@Controller('discovery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.APPRENTICE)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

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

  @Get('mentors/:profileId')
  async getMentorDetail(
    @CurrentUser() user: AuthUser,
    @Param('profileId') profileId: string,
  ): Promise<DiscoveryMentorDetailResponseDto> {
    const detail = await this.discoveryService.getMentorDetail(user, profileId);
    return toDiscoveryMentorDetailResponse(detail);
  }
}
