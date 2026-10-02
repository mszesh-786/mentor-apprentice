import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ApprenticesService } from './application/apprentices.service';
import { ApprenticeProfileResponseDto } from './dto/apprentice-profile-response.dto';
import { CreateApprenticeProfileDto } from './dto/create-apprentice-profile.dto';
import { UpdateApprenticeProfileDto } from './dto/update-apprentice-profile.dto';
import { toApprenticeProfileResponse } from './mappers/apprentice-profile.mapper';

@Controller('apprentices')
@UseGuards(JwtAuthGuard)
export class ApprenticesController {
  constructor(private readonly apprenticesService: ApprenticesService) {}

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateApprenticeProfileDto,
  ): Promise<ApprenticeProfileResponseDto> {
    const profile = await this.apprenticesService.createProfile(user, dto);
    return toApprenticeProfileResponse(profile);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.APPRENTICE)
  async getMyProfile(
    @CurrentUser() user: AuthUser,
  ): Promise<ApprenticeProfileResponseDto> {
    const profile = await this.apprenticesService.getMyProfile(user);
    return toApprenticeProfileResponse(profile);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(Role.APPRENTICE)
  async updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateApprenticeProfileDto,
  ): Promise<ApprenticeProfileResponseDto> {
    const profile = await this.apprenticesService.updateMyProfile(user, dto);
    return toApprenticeProfileResponse(profile);
  }
}
