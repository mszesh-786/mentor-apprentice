import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './application/admin.service';
import {
  AdminListReportsQueryDto,
  AdminListUsersQueryDto,
  AdminReportDetailDto,
  AdminReportListItemDto,
  AdminUserDetailDto,
  AdminUserListItemDto,
  ResolveReportDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListUsersQueryDto,
  ): Promise<AdminUserListItemDto[]> {
    return this.adminService.listUsers(user, query);
  }

  @Get('users/:userId')
  async getUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ): Promise<AdminUserDetailDto> {
    return this.adminService.getUser(user, userId);
  }

  @Post('users/:userId/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ): Promise<AdminUserListItemDto> {
    return this.adminService.suspendUser(user, userId);
  }

  @Post('users/:userId/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ): Promise<AdminUserListItemDto> {
    return this.adminService.unsuspendUser(user, userId);
  }

  @Get('reports')
  async listReports(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListReportsQueryDto,
  ): Promise<AdminReportListItemDto[]> {
    return this.adminService.listReports(user, query);
  }

  @Get('reports/:reportId')
  async getReport(
    @CurrentUser() user: AuthUser,
    @Param('reportId') reportId: string,
  ): Promise<AdminReportDetailDto> {
    return this.adminService.getReport(user, reportId);
  }

  @Post('reports/:reportId/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveReport(
    @CurrentUser() user: AuthUser,
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
  ): Promise<AdminReportDetailDto> {
    return this.adminService.resolveReport(user, reportId, dto);
  }
}
