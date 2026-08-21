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
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SessionsService } from './application/sessions.service';
import {
  JoinSessionResponseDto,
  SessionResponseDto,
  UpsertSessionSummaryDto,
} from './dto/session.dto';
import { toSessionResponse } from './mappers/session.mapper';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('me')
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query('upcoming') upcoming?: string,
  ): Promise<SessionResponseDto[]> {
    const parsed =
      upcoming === 'true' ? true : upcoming === 'false' ? false : undefined;
    const sessions = await this.sessionsService.listMine(user, {
      upcoming: parsed,
    });
    return sessions.map(toSessionResponse);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.getById(user, id);
    return toSessionResponse(session);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async join(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<JoinSessionResponseDto> {
    const session = await this.sessionsService.join(user, id);
    return toSessionResponse(session);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.complete(user, id);
    return toSessionResponse(session);
  }

  @Post(':id/report-no-show')
  @HttpCode(HttpStatus.OK)
  async reportNoShow(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.reportNoShow(user, id);
    return toSessionResponse(session);
  }

  @Post(':id/report-technical-failure')
  @HttpCode(HttpStatus.OK)
  async reportTechnicalFailure(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.reportTechnicalFailure(user, id);
    return toSessionResponse(session);
  }

  @Put(':id/summary')
  async upsertSummary(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertSessionSummaryDto,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.upsertSummary(user, id, dto);
    return toSessionResponse(session);
  }
}
