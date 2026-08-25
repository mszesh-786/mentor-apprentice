import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReportsService } from './application/reports.service';
import {
  CreateUserReportDto,
  UserReportResponseDto,
} from './dto/report.dto';
import { toUserReportResponse } from './mappers/report.mapper';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('me')
  async listMine(
    @CurrentUser() user: AuthUser,
  ): Promise<UserReportResponseDto[]> {
    const reports = await this.reportsService.listMine(user);
    return reports.map(toUserReportResponse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateUserReportDto,
  ): Promise<UserReportResponseDto> {
    const report = await this.reportsService.submit(user, dto);
    return toUserReportResponse(report);
  }
}
