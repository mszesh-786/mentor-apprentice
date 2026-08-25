import { BadRequestException } from '@nestjs/common';
import { Role, UserReportReason, UserReportStatus, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { UsersService } from '../../users/users.service';
import { ReportsRepository } from '../persistence/reports.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const apprentice: AuthUser = {
    id: 'apprentice-1',
    authProviderId: 'sub-apprentice',
    email: 'apprentice@example.com',
    displayName: 'Apprentice',
    roles: [Role.APPRENTICE],
    emailVerified: true,
    status: UserStatus.ACTIVE,
  };

  let repository: jest.Mocked<ReportsRepository>;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let service: ReportsService;

  beforeEach(() => {
    repository = {
      findBookingContext: jest.fn(),
      findSessionContext: jest.fn(),
      findMentorshipContext: jest.fn(),
      hasInteractionBetween: jest.fn(),
      findOpenReport: jest.fn(),
      create: jest.fn(),
      listForReporter: jest.fn(),
    } as unknown as jest.Mocked<ReportsRepository>;
    usersService = { findById: jest.fn() };
    service = new ReportsService(
      repository,
      usersService as UsersService,
    );
  });

  it('creates a session-scoped report', async () => {
    usersService.findById.mockResolvedValue({
      id: 'mentor-1',
      authProviderId: 'sub-mentor',
      email: 'mentor@example.com',
      displayName: 'Mentor',
      roles: [Role.MENTOR],
      emailVerified: true,
      status: UserStatus.ACTIVE,
    });
    repository.findSessionContext.mockResolvedValue({
      mentorUserId: 'mentor-1',
      apprenticeUserId: 'apprentice-1',
      bookingId: 'booking-1',
    });
    repository.findOpenReport.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 'report-1',
      reporterUserId: 'apprentice-1',
      reportedUserId: 'mentor-1',
      reportedDisplayName: 'Mentor',
      bookingId: 'booking-1',
      sessionId: 'session-1',
      mentorshipId: null,
      reason: UserReportReason.HARASSMENT,
      description: 'Detailed concern about behavior during session.',
      status: UserReportStatus.OPEN,
      createdAt: new Date(),
      resolvedAt: null,
    });

    await service.submit(apprentice, {
      reportedUserId: 'mentor-1',
      reason: UserReportReason.HARASSMENT,
      description: 'Detailed concern about behavior during session.',
      sessionId: 'session-1',
    });

    expect(repository.create).toHaveBeenCalledWith({
      reporterUserId: 'apprentice-1',
      reportedUserId: 'mentor-1',
      bookingId: 'booking-1',
      sessionId: 'session-1',
      mentorshipId: null,
      reason: UserReportReason.HARASSMENT,
      description: 'Detailed concern about behavior during session.',
    });
  });

  it('rejects self-report', async () => {
    await expect(
      service.submit(apprentice, {
        reportedUserId: apprentice.id,
        reason: UserReportReason.OTHER,
        description: 'Trying to report myself here.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
