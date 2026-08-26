import { BadRequestException } from '@nestjs/common';
import {
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
import { AdminRepository } from '../persistence/admin.repository';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const admin: AuthUser = {
    id: 'admin-1',
    authProviderId: 'admin-sub',
    email: 'admin@example.com',
    emailVerified: true,
    displayName: 'Admin',
    status: UserStatus.ACTIVE,
    roles: [Role.ADMIN],
  };

  let repository: jest.Mocked<
    Pick<
      AdminRepository,
      | 'listUsers'
      | 'findUserDetail'
      | 'setUserStatus'
      | 'listReports'
      | 'findReport'
      | 'resolveReport'
    >
  >;
  let service: AdminService;

  beforeEach(() => {
    repository = {
      listUsers: jest.fn(),
      findUserDetail: jest.fn(),
      setUserStatus: jest.fn(),
      listReports: jest.fn(),
      findReport: jest.fn(),
      resolveReport: jest.fn(),
    };
    service = new AdminService(repository as unknown as AdminRepository);
  });

  it('rejects non-admin callers', async () => {
    const mentor: AuthUser = {
      ...admin,
      roles: [Role.MENTOR],
    };
    await expect(service.listUsers(mentor, {})).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('suspends an active user', async () => {
    repository.findUserDetail.mockResolvedValue({
      id: 'user-1',
      email: 'u@example.com',
      displayName: 'User',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      roles: [{ role: Role.MENTOR }],
      mentorProfile: null,
      verifications: [],
      _count: { reportsReceived: 0 },
    });
    repository.setUserStatus.mockResolvedValue({
      id: 'user-1',
      email: 'u@example.com',
      displayName: 'User',
      status: UserStatus.SUSPENDED,
      emailVerified: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      roles: [{ role: Role.MENTOR }],
    });

    const result = await service.suspendUser(admin, 'user-1');
    expect(result.status).toBe(UserStatus.SUSPENDED);
    expect(repository.setUserStatus).toHaveBeenCalledWith(
      'user-1',
      UserStatus.SUSPENDED,
    );
  });

  it('refuses self-suspend', async () => {
    await expect(service.suspendUser(admin, admin.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('resolves report with USER_SUSPENDED and updates reported user', async () => {
    repository.findReport.mockResolvedValue({
      id: 'report-1',
      reporterUserId: 'reporter-1',
      reportedUserId: 'reported-1',
      bookingId: null,
      sessionId: null,
      mentorshipId: null,
      reason: 'HARASSMENT',
      description: 'Bad behavior during session interaction.',
      status: UserReportStatus.OPEN,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      resolvedAt: null,
      resolutionOutcome: null,
      resolutionNote: null,
      resolvedByUserId: null,
      reporter: { displayName: 'Reporter' },
      reported: { displayName: 'Reported' },
    });
    repository.resolveReport.mockResolvedValue({
      id: 'report-1',
      reporterUserId: 'reporter-1',
      reportedUserId: 'reported-1',
      bookingId: null,
      sessionId: null,
      mentorshipId: null,
      reason: 'HARASSMENT',
      description: 'Bad behavior during session interaction.',
      status: UserReportStatus.RESOLVED,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      resolvedAt: new Date('2026-01-03T00:00:00.000Z'),
      resolutionOutcome: UserReportResolutionOutcome.USER_SUSPENDED,
      resolutionNote: 'Confirmed',
      resolvedByUserId: admin.id,
      reporter: { displayName: 'Reporter' },
      reported: { displayName: 'Reported' },
    });

    const result = await service.resolveReport(admin, 'report-1', {
      outcome: UserReportResolutionOutcome.USER_SUSPENDED,
      note: 'Confirmed',
    });

    expect(result.status).toBe(UserReportStatus.RESOLVED);
    expect(result.resolutionOutcome).toBe(
      UserReportResolutionOutcome.USER_SUSPENDED,
    );
    expect(repository.resolveReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportedUserStatus: UserStatus.SUSPENDED,
        reportedUserId: 'reported-1',
      }),
    );
  });

  it('rejects resolve on closed report', async () => {
    repository.findReport.mockResolvedValue({
      id: 'report-1',
      reporterUserId: 'reporter-1',
      reportedUserId: 'reported-1',
      bookingId: null,
      sessionId: null,
      mentorshipId: null,
      reason: 'SPAM',
      description: 'Already handled report description text.',
      status: UserReportStatus.RESOLVED,
      createdAt: new Date(),
      resolvedAt: new Date(),
      resolutionOutcome: UserReportResolutionOutcome.NO_ACTION,
      resolutionNote: null,
      resolvedByUserId: admin.id,
      reporter: { displayName: null },
      reported: { displayName: null },
    });

    await expect(
      service.resolveReport(admin, 'report-1', {
        outcome: UserReportResolutionOutcome.NO_ACTION,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns not found for missing user', async () => {
    repository.findUserDetail.mockResolvedValue(null);
    await expect(service.getUser(admin, 'missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
