import {
  BookingStatus,
  ExpertiseStatus,
  PublicationStatus,
  Role,
  TeachingLevel,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import { ApprenticesRepository } from '../../apprentices/persistence/apprentices.repository';
import { BlocksService } from '../../blocks/application/blocks.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { AvailabilityService } from '../../mentors/availability/application/availability.service';
import { MentorsRepository } from '../../mentors/persistence/mentors.repository';
import { SkillsService } from '../../skills/application/skills.service';
import { UsersService } from '../../users/users.service';
import { VerificationService } from '../../verification/application/verification.service';
import { Booking } from '../domain/booking';
import { BookingsRepository } from '../persistence/bookings.repository';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  const apprentice: AuthUser = {
    id: 'apprentice-user',
    authProviderId: 'auth-a',
    email: 'a@example.com',
    emailVerified: true,
    displayName: 'Alex',
    status: UserStatus.ACTIVE,
    roles: [Role.APPRENTICE],
  };

  const mentorUser: AuthUser = {
    id: 'mentor-user',
    authProviderId: 'auth-m',
    email: 'm@example.com',
    emailVerified: true,
    displayName: 'Morgan',
    status: UserStatus.ACTIVE,
    roles: [Role.MENTOR],
  };

  const mentorProfile = {
    id: 'mentor-profile',
    userId: 'mentor-user',
    headline: 'Mentor',
    biography: null,
    generalLocation: null,
    timezone: 'Europe/Helsinki',
    profilePhotoUrl: null,
    hourlyRate: null,
    currency: null,
    publicationStatus: PublicationStatus.PUBLISHED,
    languages: [],
    expertise: [
      {
        id: 'exp-1',
        skillId: 'skill-1',
        yearsExperience: 10,
        description: null,
        teachingLevel: TeachingLevel.BEGINNER,
        status: ExpertiseStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    identityVerificationStatus: VerificationStatus.VERIFIED,
    hasAvailability: true,
    publicationEligibility: { eligible: true, requirements: [] },
    isBookable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const booking: Booking = {
    id: 'booking-1',
    mentorProfileId: 'mentor-profile',
    apprenticeProfileId: 'apprentice-profile',
    skillId: 'skill-1',
    startAt: new Date('2026-08-24T07:00:00.000Z'),
    endAt: new Date('2026-08-24T07:30:00.000Z'),
    timezoneSnapshot: 'Europe/Helsinki',
    status: BookingStatus.REQUESTED,
    apprenticeMessage: null,
    declineReason: null,
    cancelledByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    mentorDisplayName: 'Morgan',
    apprenticeDisplayName: 'Alex',
    skillName: 'Basic Car Maintenance',
    mentorUserId: 'mentor-user',
    apprenticeUserId: 'apprentice-user',
  };

  let bookingsRepository: jest.Mocked<
    Pick<
      BookingsRepository,
      | 'create'
      | 'findById'
      | 'listForMentorUser'
      | 'listForApprenticeUser'
      | 'findReservedOverlapping'
      | 'findRequestedOverlapping'
      | 'acceptWithConflictDecline'
      | 'updateStatus'
    >
  >;
  let mentorsRepository: jest.Mocked<Pick<MentorsRepository, 'findById'>>;
  let apprenticesRepository: jest.Mocked<
    Pick<ApprenticesRepository, 'findByUserId'>
  >;
  let availabilityService: jest.Mocked<
    Pick<
      AvailabilityService,
      | 'getActiveRulesForMentor'
      | 'getExceptionsInRange'
      | 'hasActiveAvailability'
    >
  >;
  let skillsService: jest.Mocked<Pick<SkillsService, 'assertActiveSkill'>>;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let verificationService: jest.Mocked<
    Pick<VerificationService, 'getIdentityStatus'>
  >;
  let blocksService: jest.Mocked<Pick<BlocksService, 'getExcludedUserIds'>>;
  let analyticsService: jest.Mocked<
    Pick<
      AnalyticsService,
      | 'recordBookingRequested'
      | 'recordBookingAccepted'
      | 'recordBookingDeclined'
      | 'recordBookingCancelled'
    >
  >;
  let service: BookingsService;

  beforeEach(() => {
    bookingsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listForMentorUser: jest.fn(),
      listForApprenticeUser: jest.fn(),
      findReservedOverlapping: jest.fn().mockResolvedValue([]),
      findRequestedOverlapping: jest.fn().mockResolvedValue([]),
      acceptWithConflictDecline: jest.fn(),
      updateStatus: jest.fn(),
    };
    mentorsRepository = {
      findById: jest.fn().mockResolvedValue(mentorProfile),
    };
    apprenticesRepository = {
      findByUserId: jest.fn().mockResolvedValue({
        id: 'apprentice-profile',
        userId: 'apprentice-user',
      }),
    };
    availabilityService = {
      getActiveRulesForMentor: jest.fn().mockResolvedValue([
        {
          id: 'rule-1',
          mentorProfileId: 'mentor-profile',
          dayOfWeek: 'MONDAY',
          startTime: '10:00',
          endTime: '13:00',
          timezone: 'Europe/Helsinki',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      getExceptionsInRange: jest.fn().mockResolvedValue([]),
      hasActiveAvailability: jest.fn().mockResolvedValue(true),
    };
    skillsService = {
      assertActiveSkill: jest.fn().mockResolvedValue({
        id: 'skill-1',
        name: 'Basic Car Maintenance',
      }),
    };
    usersService = {
      findById: jest.fn().mockResolvedValue({
        id: 'mentor-user',
        status: UserStatus.ACTIVE,
      }),
    };
    verificationService = {
      getIdentityStatus: jest
        .fn()
        .mockResolvedValue(VerificationStatus.VERIFIED),
    };
    blocksService = { getExcludedUserIds: jest.fn().mockResolvedValue([]) };
    analyticsService = {
      recordBookingRequested: jest.fn(),
      recordBookingAccepted: jest.fn(),
      recordBookingDeclined: jest.fn(),
      recordBookingCancelled: jest.fn(),
    };

    service = new BookingsService(
      bookingsRepository as unknown as BookingsRepository,
      mentorsRepository as unknown as MentorsRepository,
      apprenticesRepository as unknown as ApprenticesRepository,
      availabilityService as unknown as AvailabilityService,
      skillsService as unknown as SkillsService,
      usersService as unknown as UsersService,
      verificationService as unknown as VerificationService,
      blocksService as unknown as BlocksService,
      analyticsService as unknown as AnalyticsService,
    );
  });

  it('creates a booking request without reserving', async () => {
    bookingsRepository.create.mockResolvedValue(booking);

    const created = await service.create(apprentice, {
      mentorProfileId: 'mentor-profile',
      skillId: 'skill-1',
      startAt: '2026-08-24T07:00:00.000Z',
      durationMinutes: 30,
    });

    expect(created.status).toBe(BookingStatus.REQUESTED);
    expect(analyticsService.recordBookingRequested).toHaveBeenCalled();
  });

  it('rejects self-booking', async () => {
    mentorsRepository.findById.mockResolvedValue({
      ...mentorProfile,
      userId: apprentice.id,
    });

    await expect(
      service.create(apprentice, {
        mentorProfileId: 'mentor-profile',
        skillId: 'skill-1',
        startAt: '2026-08-24T07:00:00.000Z',
        durationMinutes: 30,
      }),
    ).rejects.toThrow('Cannot book yourself');
  });

  it('accepts and auto-declines conflicts', async () => {
    bookingsRepository.findById.mockResolvedValue(booking);
    bookingsRepository.findRequestedOverlapping.mockResolvedValue([
      { ...booking, id: 'booking-2' },
    ]);
    bookingsRepository.acceptWithConflictDecline.mockResolvedValue({
      ...booking,
      status: BookingStatus.ACCEPTED,
    });

    const accepted = await service.accept(mentorUser, 'booking-1');

    expect(accepted.status).toBe(BookingStatus.ACCEPTED);
    expect(bookingsRepository.acceptWithConflictDecline).toHaveBeenCalledWith(
      'booking-1',
      ['booking-2'],
    );
  });

  it('forbids non-mentor accept', async () => {
    bookingsRepository.findById.mockResolvedValue(booking);
    await expect(
      service.accept(apprentice, 'booking-1'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('cancels accepted booking by apprentice', async () => {
    bookingsRepository.findById.mockResolvedValue({
      ...booking,
      status: BookingStatus.ACCEPTED,
    });
    bookingsRepository.updateStatus.mockResolvedValue({
      ...booking,
      status: BookingStatus.CANCELLED,
      cancelledByUserId: apprentice.id,
    });

    const cancelled = await service.cancel(apprentice, 'booking-1');
    expect(cancelled.status).toBe(BookingStatus.CANCELLED);
  });

  it('returns not found when mentor is unpublished', async () => {
    mentorsRepository.findById.mockResolvedValue({
      ...mentorProfile,
      publicationStatus: PublicationStatus.DRAFT,
    });

    await expect(
      service.create(apprentice, {
        mentorProfileId: 'mentor-profile',
        skillId: 'skill-1',
        startAt: '2026-08-24T07:00:00.000Z',
        durationMinutes: 30,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects accept when slot already reserved', async () => {
    bookingsRepository.findById.mockResolvedValue(booking);
    bookingsRepository.findReservedOverlapping.mockResolvedValue([
      { ...booking, id: 'other', status: BookingStatus.ACCEPTED },
    ]);

    await expect(
      service.accept(mentorUser, 'booking-1'),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
