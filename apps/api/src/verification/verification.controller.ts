import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { VerificationService } from './application/verification.service';
import { IdentityVerificationResponseDto } from './dto/identity-verification-response.dto';
import { StubVerificationResultDto } from './dto/stub-verification-result.dto';
import { toIdentityVerificationResponse } from './mappers/verification.mapper';

@Controller('verifications')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('me')
  async getMine(
    @CurrentUser() user: AuthUser,
  ): Promise<IdentityVerificationResponseDto> {
    const verification = await this.verificationService.getIdentity(user.id);
    return toIdentityVerificationResponse(verification);
  }

  @Post('identity')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR)
  @HttpCode(HttpStatus.CREATED)
  async startIdentity(
    @CurrentUser() user: AuthUser,
  ): Promise<IdentityVerificationResponseDto> {
    const verification = await this.verificationService.startIdentity(user);
    return toIdentityVerificationResponse(verification);
  }

  @Post('identity/stub-result')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR)
  @HttpCode(HttpStatus.OK)
  async applyStubResult(
    @CurrentUser() user: AuthUser,
    @Body() dto: StubVerificationResultDto,
  ): Promise<IdentityVerificationResponseDto> {
    const verification = await this.verificationService.applyStubResult(
      user,
      dto.status,
    );
    return toIdentityVerificationResponse(verification);
  }
}
