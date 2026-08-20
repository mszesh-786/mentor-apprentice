import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MentorsService } from './application/mentors.service';
import { AvailabilityService } from './availability/application/availability.service';
import { AvailabilityRuleResponseDto } from './availability/dto/availability-rule-response.dto';
import { SetMentorAvailabilityDto } from './availability/dto/set-mentor-availability.dto';
import { toAvailabilityRuleResponse } from './availability/mappers/availability-rule.mapper';
import { CreateMentorExpertiseDto } from './dto/create-mentor-expertise.dto';
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';
import { MentorProfileResponseDto } from './dto/mentor-profile-response.dto';
import { SetMentorLanguagesDto } from './dto/set-mentor-languages.dto';
import { UpdateMentorExpertiseDto } from './dto/update-mentor-expertise.dto';
import { UpdateMentorProfileDto } from './dto/update-mentor-profile.dto';
import { PublicationService } from './publication/application/publication.service';
import { PublicationEligibilityResponseDto } from './publication/dto/publication-eligibility-response.dto';
import { toPublicationEligibilityResponse } from './publication/mappers/publication.mapper';
import { toMentorProfileResponse } from './mappers/mentor-profile.mapper';

@Controller('mentors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MENTOR)
export class MentorsController {
  constructor(
    private readonly mentorsService: MentorsService,
    private readonly availabilityService: AvailabilityService,
    private readonly publicationService: PublicationService,
  ) {}

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMentorProfileDto,
  ): Promise<MentorProfileResponseDto> {
    const profile = await this.mentorsService.createProfile(user, dto);
    return toMentorProfileResponse(profile);
  }

  @Get('me')
  async getMyProfile(
    @CurrentUser() user: AuthUser,
  ): Promise<MentorProfileResponseDto> {
    const profile = await this.mentorsService.getMyProfile(user);
    return toMentorProfileResponse(profile);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMentorProfileDto,
  ): Promise<MentorProfileResponseDto> {
    const profile = await this.mentorsService.updateMyProfile(user, dto);
    return toMentorProfileResponse(profile);
  }

  @Put('me/languages')
  async setMyLanguages(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetMentorLanguagesDto,
  ): Promise<MentorProfileResponseDto> {
    const profile = await this.mentorsService.setMyLanguages(
      user,
      dto.languageIds,
    );
    return toMentorProfileResponse(profile);
  }

  @Post('me/expertise')
  @HttpCode(HttpStatus.CREATED)
  async addExpertise(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMentorExpertiseDto,
  ): Promise<MentorProfileResponseDto> {
    const profile = await this.mentorsService.addExpertise(user, dto);
    return toMentorProfileResponse(profile);
  }

  @Patch('me/expertise/:expertiseId')
  async updateExpertise(
    @CurrentUser() user: AuthUser,
    @Param('expertiseId') expertiseId: string,
    @Body() dto: UpdateMentorExpertiseDto,
  ): Promise<MentorProfileResponseDto> {
    const profile = await this.mentorsService.updateExpertise(
      user,
      expertiseId,
      dto,
    );
    return toMentorProfileResponse(profile);
  }

  @Delete('me/expertise/:expertiseId')
  async removeExpertise(
    @CurrentUser() user: AuthUser,
    @Param('expertiseId') expertiseId: string,
  ): Promise<MentorProfileResponseDto> {
    const profile = await this.mentorsService.removeExpertise(
      user,
      expertiseId,
    );
    return toMentorProfileResponse(profile);
  }

  @Get('me/availability')
  async getMyAvailability(
    @CurrentUser() user: AuthUser,
  ): Promise<AvailabilityRuleResponseDto[]> {
    const rules = await this.availabilityService.getMyRules(user);
    return rules.map(toAvailabilityRuleResponse);
  }

  @Put('me/availability')
  async setMyAvailability(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetMentorAvailabilityDto,
  ): Promise<AvailabilityRuleResponseDto[]> {
    const rules = await this.availabilityService.replaceMyRules(
      user,
      dto.rules,
    );
    return rules.map(toAvailabilityRuleResponse);
  }

  @Delete('me/availability/:ruleId')
  async removeAvailabilityRule(
    @CurrentUser() user: AuthUser,
    @Param('ruleId') ruleId: string,
  ): Promise<AvailabilityRuleResponseDto[]> {
    const rules = await this.availabilityService.removeMyRule(user, ruleId);
    return rules.map(toAvailabilityRuleResponse);
  }

  @Get('me/publication-eligibility')
  async getPublicationEligibility(
    @CurrentUser() user: AuthUser,
  ): Promise<PublicationEligibilityResponseDto> {
    const eligibility = await this.publicationService.getEligibility(user);
    return toPublicationEligibilityResponse(eligibility);
  }

  @Post('me/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @CurrentUser() user: AuthUser,
  ): Promise<MentorProfileResponseDto> {
    await this.publicationService.publish(user);
    const profile = await this.mentorsService.getMyProfile(user);
    return toMentorProfileResponse(profile);
  }

  @Post('me/unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublish(
    @CurrentUser() user: AuthUser,
  ): Promise<MentorProfileResponseDto> {
    await this.publicationService.unpublish(user);
    const profile = await this.mentorsService.getMyProfile(user);
    return toMentorProfileResponse(profile);
  }
}
