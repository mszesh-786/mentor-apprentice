import { Injectable } from '@nestjs/common';
import {
  PublicationStatus,
  UserReportResolutionOutcome,
  UserReportStatus,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type AdminUserListRow = {
  id: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  roles: { role: string }[];
};

export type AdminUserDetailRow = AdminUserListRow & {
  mentorProfile: {
    id: string;
    publicationStatus: PublicationStatus;
  } | null;
  verifications: { status: VerificationStatus }[];
  _count: { reportsReceived: number };
};

export type AdminReportRow = {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  bookingId: string | null;
  sessionId: string | null;
  mentorshipId: string | null;
  reason: string;
  description: string;
  status: UserReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  resolutionOutcome: UserReportResolutionOutcome | null;
  resolutionNote: string | null;
  resolvedByUserId: string | null;
  reporter: { displayName: string | null };
  reported: { displayName: string | null };
};

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(input: {
    q?: string;
    status?: UserStatus;
  }): Promise<AdminUserListRow[]> {
    const q = input.q?.trim();
    return this.prisma.user.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { displayName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { roles: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findUserDetail(userId: string): Promise<AdminUserDetailRow | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        mentorProfile: {
          select: {
            id: true,
            publicationStatus: true,
          },
        },
        verifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
        _count: {
          select: {
            reportsReceived: {
              where: { status: UserReportStatus.OPEN },
            },
          },
        },
      },
    });
  }

  async setUserStatus(
    userId: string,
    status: UserStatus,
  ): Promise<AdminUserListRow> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      include: { roles: true },
    });
  }

  async listReports(input: {
    status?: UserReportStatus;
  }): Promise<AdminReportRow[]> {
    return this.prisma.userReport.findMany({
      where: input.status ? { status: input.status } : undefined,
      include: {
        reporter: { select: { displayName: true } },
        reported: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findReport(reportId: string): Promise<AdminReportRow | null> {
    return this.prisma.userReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { displayName: true } },
        reported: { select: { displayName: true } },
      },
    });
  }

  async resolveReport(input: {
    reportId: string;
    status: UserReportStatus;
    outcome: UserReportResolutionOutcome;
    note: string | null;
    resolvedByUserId: string;
    reportedUserStatus?: UserStatus;
    reportedUserId?: string;
  }): Promise<AdminReportRow> {
    return this.prisma.$transaction(async (tx) => {
      if (input.reportedUserStatus && input.reportedUserId) {
        await tx.user.update({
          where: { id: input.reportedUserId },
          data: { status: input.reportedUserStatus },
        });
      }

      return tx.userReport.update({
        where: { id: input.reportId },
        data: {
          status: input.status,
          resolutionOutcome: input.outcome,
          resolutionNote: input.note,
          resolvedByUserId: input.resolvedByUserId,
          resolvedAt: new Date(),
        },
        include: {
          reporter: { select: { displayName: true } },
          reported: { select: { displayName: true } },
        },
      });
    });
  }
}
