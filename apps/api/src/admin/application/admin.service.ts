import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PublicationStatus,
  Role,
  UserReportResolutionOutcome,
  UserReportStatus,
  UserStatus,
} from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import {
  AdminReportDetailDto,
  AdminReportListItemDto,
  AdminUserDetailDto,
  AdminUserListItemDto,
  ResolveReportDto,
} from '../dto/admin.dto';
import {
  AdminReportRow,
  AdminRepository,
  AdminUserDetailRow,
  AdminUserListRow,
} from '../persistence/admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async listUsers(
    admin: AuthUser,
    query: { q?: string; status?: UserStatus },
  ): Promise<AdminUserListItemDto[]> {
    this.assertAdmin(admin);
    const rows = await this.adminRepository.listUsers(query);
    return rows.map((row) => this.toUserListItem(row));
  }

  async getUser(admin: AuthUser, userId: string): Promise<AdminUserDetailDto> {
    this.assertAdmin(admin);
    const row = await this.adminRepository.findUserDetail(userId);
    if (!row) {
      throw new NotFoundError('User not found');
    }
    return this.toUserDetail(row);
  }

  async suspendUser(
    admin: AuthUser,
    userId: string,
  ): Promise<AdminUserListItemDto> {
    this.assertAdmin(admin);
    if (admin.id === userId) {
      throw new BadRequestException('Cannot suspend yourself');
    }
    const existing = await this.adminRepository.findUserDetail(userId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }
    if (existing.status === UserStatus.SUSPENDED) {
      return this.toUserListItem(existing);
    }
    if (existing.status === UserStatus.DEACTIVATED) {
      throw new ConflictError('Cannot suspend a deactivated user');
    }
    const updated = await this.adminRepository.setUserStatus(
      userId,
      UserStatus.SUSPENDED,
    );
    return this.toUserListItem(updated);
  }

  async unsuspendUser(
    admin: AuthUser,
    userId: string,
  ): Promise<AdminUserListItemDto> {
    this.assertAdmin(admin);
    const existing = await this.adminRepository.findUserDetail(userId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }
    if (existing.status !== UserStatus.SUSPENDED) {
      throw new ConflictError('User is not suspended');
    }
    const updated = await this.adminRepository.setUserStatus(
      userId,
      UserStatus.ACTIVE,
    );
    return this.toUserListItem(updated);
  }

  async listReports(
    admin: AuthUser,
    query: { status?: UserReportStatus },
  ): Promise<AdminReportListItemDto[]> {
    this.assertAdmin(admin);
    const rows = await this.adminRepository.listReports(query);
    return rows.map((row) => this.toReportListItem(row));
  }

  async getReport(
    admin: AuthUser,
    reportId: string,
  ): Promise<AdminReportDetailDto> {
    this.assertAdmin(admin);
    const row = await this.adminRepository.findReport(reportId);
    if (!row) {
      throw new NotFoundError('Report not found');
    }
    return this.toReportDetail(row);
  }

  async resolveReport(
    admin: AuthUser,
    reportId: string,
    dto: ResolveReportDto,
  ): Promise<AdminReportDetailDto> {
    this.assertAdmin(admin);
    const existing = await this.adminRepository.findReport(reportId);
    if (!existing) {
      throw new NotFoundError('Report not found');
    }
    if (
      existing.status === UserReportStatus.RESOLVED ||
      existing.status === UserReportStatus.DISMISSED
    ) {
      throw new ConflictError('Report is already closed');
    }

    const status =
      dto.outcome === UserReportResolutionOutcome.DISMISSED
        ? UserReportStatus.DISMISSED
        : UserReportStatus.RESOLVED;

    let reportedUserStatus: UserStatus | undefined;
    if (dto.outcome === UserReportResolutionOutcome.USER_SUSPENDED) {
      if (admin.id === existing.reportedUserId) {
        throw new BadRequestException('Cannot suspend yourself via report');
      }
      reportedUserStatus = UserStatus.SUSPENDED;
    } else if (dto.outcome === UserReportResolutionOutcome.USER_DEACTIVATED) {
      if (admin.id === existing.reportedUserId) {
        throw new BadRequestException('Cannot deactivate yourself via report');
      }
      reportedUserStatus = UserStatus.DEACTIVATED;
    }

    const updated = await this.adminRepository.resolveReport({
      reportId,
      status,
      outcome: dto.outcome,
      note: dto.note?.trim() || null,
      resolvedByUserId: admin.id,
      reportedUserStatus,
      reportedUserId: reportedUserStatus ? existing.reportedUserId : undefined,
    });

    return this.toReportDetail(updated);
  }

  private assertAdmin(user: AuthUser): void {
    if (!user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenError('Admin role required');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }

  private toUserListItem(row: AdminUserListRow): AdminUserListItemDto {
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      status: row.status,
      roles: row.roles.map((entry) => entry.role),
      emailVerified: row.emailVerified,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toUserDetail(row: AdminUserDetailRow): AdminUserDetailDto {
    return {
      ...this.toUserListItem(row),
      mentorProfileId: row.mentorProfile?.id ?? null,
      mentorPublicationStatus: row.mentorProfile?.publicationStatus ?? null,
      mentorIsBookable: row.mentorProfile
        ? row.mentorProfile.publicationStatus === PublicationStatus.PUBLISHED &&
          row.status === UserStatus.ACTIVE
        : null,
      verificationStatus: row.verifications[0]?.status ?? null,
      openReportsReceived: row._count.reportsReceived,
    };
  }

  private toReportListItem(row: AdminReportRow): AdminReportListItemDto {
    return {
      id: row.id,
      reporterUserId: row.reporterUserId,
      reporterDisplayName: row.reporter.displayName,
      reportedUserId: row.reportedUserId,
      reportedDisplayName: row.reported.displayName,
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      resolutionOutcome: row.resolutionOutcome,
    };
  }

  private toReportDetail(row: AdminReportRow): AdminReportDetailDto {
    return {
      ...this.toReportListItem(row),
      bookingId: row.bookingId,
      sessionId: row.sessionId,
      mentorshipId: row.mentorshipId,
      resolutionNote: row.resolutionNote,
      resolvedByUserId: row.resolvedByUserId,
    };
  }
}
