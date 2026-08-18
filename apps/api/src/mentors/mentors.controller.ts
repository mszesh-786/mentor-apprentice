import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';
import { MentorProfileResponseDto } from './dto/mentor-profile-response.dto';
import { SetMentorLanguagesDto } from './dto/set-mentor-languages.dto';
import { UpdateMentorProfileDto } from './dto/update-mentor-profile.dto';
import { toMentorProfileResponse } from './mappers/mentor-profile.mapper';

@Controller('mentors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MENTOR)
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

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
}
