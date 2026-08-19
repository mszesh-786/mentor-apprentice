import { BadRequestException } from '@nestjs/common';
import {
  AvailabilityRuleStatus,
  DayOfWeek,
  PublicationStatus,
  Role,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { AuthUser } from '../../../auth/auth-user';
import { NotFoundError } from '../../../common/errors/domain-error';
import { MentorProfile } from '../../domain/mentor-profile';
import { MentorsRepository } from '../../persistence/mentors.repository';
import { AvailabilityRule } from '../domain/availability-rule';
import { AvailabilityRepository } from '../persistence/availability.repository';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  const activeMentor: AuthUser = {
    id: 'user-1',
    authProviderId: 'auth-1',
    email: 'mentor@example.com',
    emailVerified: true,
    displayName: 'David',
    status: UserStatus.ACTIVE,
    roles: [Role.MENTOR],
  };

  const profile: MentorProfile = {
    id: 'profile-1',
    userId: 'user-1',
    headline: 'Mechanic',
    biography: null,
    generalLocation: null,
    timezone: 'Europe/Helsinki',
    profilePhotoUrl: null,
    hourlyRate: null,
    currency: null,
    publicationStatus: PublicationStatus.DRAFT,
    languages: [],
    expertise: [],
    identityVerificationStatus: VerificationStatus.NOT_STARTED,
    hasAvailability: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mondayRule: AvailabilityRule = {
    id: 'rule-1',
    mentorProfileId: 'profile-1',
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: '10:00',
    endTime: '13:00',
    timezone: 'Europe/Helsinki',
    status: AvailabilityRuleStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let availabilityRepository: jest.Mocked<
    Pick<
      AvailabilityRepository,
      | 'findByMentorProfileId'
      | 'replaceForMentorProfile'
      | 'findById'
      | 'deleteById'
      | 'countActiveByMentorProfileId'
    >
  >;
  let mentorsRepository: jest.Mocked<Pick<MentorsRepository, 'findByUserId'>>;
  let service: AvailabilityService;

  beforeEach(() => {
    availabilityRepository = {
      findByMentorProfileId: jest.fn(),
      replaceForMentorProfile: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      countActiveByMentorProfileId: jest.fn(),
    };
    mentorsRepository = {
      findByUserId: jest.fn(),
    };
    service = new AvailabilityService(
      availabilityRepository as unknown as AvailabilityRepository,
      mentorsRepository as unknown as MentorsRepository,
    );
  });

  it('returns own availability rules', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(profile);
    availabilityRepository.findByMentorProfileId.mockResolvedValue([
      mondayRule,
    ]);

    await expect(service.getMyRules(activeMentor)).resolves.toEqual([
      mondayRule,
    ]);
  });

  it('replaces availability with profile timezone default', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(profile);
    availabilityRepository.replaceForMentorProfile.mockResolvedValue([
      mondayRule,
    ]);

    await expect(
      service.replaceMyRules(activeMentor, [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '10:00',
          endTime: '13:00',
        },
      ]),
    ).resolves.toEqual([mondayRule]);

    expect(availabilityRepository.replaceForMentorProfile).toHaveBeenCalledWith(
      'profile-1',
      [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '10:00',
          endTime: '13:00',
          timezone: 'Europe/Helsinki',
        },
      ],
    );
  });

  it('rejects invalid time windows', () => {
    expect(() =>
      service.normalizeRules(
        [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '13:00',
            endTime: '10:00',
          },
        ],
        'Europe/Helsinki',
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects overlapping windows on the same day', () => {
    expect(() =>
      service.normalizeRules(
        [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '10:00',
            endTime: '12:00',
          },
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '11:00',
            endTime: '13:00',
          },
        ],
        'Europe/Helsinki',
      ),
    ).toThrow(BadRequestException);
  });

  it('allows adjacent windows on the same day', () => {
    const normalized = service.normalizeRules(
      [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '10:00',
          endTime: '12:00',
        },
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '12:00',
          endTime: '14:00',
        },
      ],
      'Europe/Helsinki',
    );

    expect(normalized).toHaveLength(2);
  });

  it('deletes own availability rule', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(profile);
    availabilityRepository.findById.mockResolvedValue(mondayRule);
    availabilityRepository.findByMentorProfileId.mockResolvedValue([]);

    await expect(service.removeMyRule(activeMentor, 'rule-1')).resolves.toEqual(
      [],
    );
    expect(availabilityRepository.deleteById).toHaveBeenCalledWith('rule-1');
  });

  it('rejects deleting another mentor rule', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(profile);
    availabilityRepository.findById.mockResolvedValue({
      ...mondayRule,
      mentorProfileId: 'other-profile',
    });

    await expect(
      service.removeMyRule(activeMentor, 'rule-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('reports active availability', async () => {
    availabilityRepository.countActiveByMentorProfileId.mockResolvedValue(2);

    await expect(service.hasActiveAvailability('profile-1')).resolves.toBe(
      true,
    );
  });
});
