import {
  CatalogueStatus,
  ExpertiseStatus,
  PublicationStatus,
  Role,
  TeachingLevel,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { AuthUser } from '../../../auth/auth-user';
import {
  ConflictError,
  NotFoundError,
  PublicationNotEligibleError,
} from '../../../common/errors/domain-error';
import { UserRecord } from '../../../users/users.types';
import { UsersService } from '../../../users/users.service';
import { VerificationService } from '../../../verification/application/verification.service';
import { AvailabilityService } from '../../availability/application/availability.service';
import { MentorProfile } from '../../domain/mentor-profile';
import { MentorsRepository } from '../../persistence/mentors.repository';
import { PublicationService } from './publication.service';

describe('PublicationService', () => {
  const activeMentor: AuthUser = {
    id: 'user-1',
    authProviderId: 'auth-1',
    email: 'mentor@example.com',
    emailVerified: true,
    displayName: 'David',
    status: UserStatus.ACTIVE,
    roles: [Role.MENTOR],
  };

  const userRecord: UserRecord = {
    id: 'user-1',
    authProviderId: 'auth-1',
    email: 'mentor@example.com',
    emailVerified: true,
    displayName: 'David Thompson',
    status: UserStatus.ACTIVE,
    roles: [Role.MENTOR],
  };

  const baseProfile: MentorProfile = {
    id: 'profile-1',
    userId: 'user-1',
    headline: 'Mechanic',
    biography: 'Thirty years of workshop experience',
    generalLocation: 'Helsinki',
    timezone: 'Europe/Helsinki',
    profilePhotoUrl: null,
    hourlyRate: '45.00',
    currency: 'EUR',
    publicationStatus: PublicationStatus.DRAFT,
    languages: [{ id: 'lang-1', code: 'en', name: 'English', sortOrder: 1 }],
    expertise: [
      {
        id: 'exp-1',
        mentorProfileId: 'profile-1',
        skillId: 'skill-1',
        yearsExperience: 30,
        description: 'Workshop mechanic',
        teachingLevel: TeachingLevel.BEGINNER,
        status: ExpertiseStatus.ACTIVE,
        skill: {
          id: 'skill-1',
          slug: 'basic-car-maintenance',
          name: 'Basic Car Maintenance',
          description: null,
          status: CatalogueStatus.ACTIVE,
          sortOrder: 1,
          category: {
            id: 'cat-1',
            slug: 'automotive',
            name: 'Automotive',
            description: null,
            sortOrder: 1,
          },
        },
      },
    ],
    identityVerificationStatus: VerificationStatus.VERIFIED,
    hasAvailability: true,
    publicationEligibility: { eligible: true, requirements: [] },
    isBookable: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let mentorsRepository: jest.Mocked<
    Pick<MentorsRepository, 'findByUserId' | 'updatePublicationStatus'>
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let verificationService: jest.Mocked<
    Pick<VerificationService, 'getIdentityStatus'>
  >;
  let availabilityService: jest.Mocked<
    Pick<AvailabilityService, 'hasActiveAvailability'>
  >;
  let service: PublicationService;

  beforeEach(() => {
    mentorsRepository = {
      findByUserId: jest.fn(),
      updatePublicationStatus: jest.fn(),
    };
    usersService = {
      findById: jest.fn(),
    };
    verificationService = {
      getIdentityStatus: jest
        .fn()
        .mockResolvedValue(VerificationStatus.VERIFIED),
    };
    availabilityService = {
      hasActiveAvailability: jest.fn().mockResolvedValue(true),
    };
    service = new PublicationService(
      mentorsRepository as unknown as MentorsRepository,
      usersService as unknown as UsersService,
      verificationService as unknown as VerificationService,
      availabilityService as unknown as AvailabilityService,
    );
  });

  it('marks profile eligible when all requirements are satisfied', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(baseProfile);
    usersService.findById.mockResolvedValue(userRecord);

    const eligibility = await service.getEligibility(activeMentor);

    expect(eligibility.eligible).toBe(true);
    expect(eligibility.requirements.every((item) => item.satisfied)).toBe(true);
  });

  it('reports missing biography clearly', async () => {
    mentorsRepository.findByUserId.mockResolvedValue({
      ...baseProfile,
      biography: '   ',
    });
    usersService.findById.mockResolvedValue(userRecord);

    const eligibility = await service.getEligibility(activeMentor);
    const biography = eligibility.requirements.find(
      (item) => item.code === 'BIOGRAPHY',
    );

    expect(eligibility.eligible).toBe(false);
    expect(biography?.satisfied).toBe(false);
  });

  it('rejects publish when identity is not verified', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(baseProfile);
    usersService.findById.mockResolvedValue(userRecord);
    verificationService.getIdentityStatus.mockResolvedValue(
      VerificationStatus.FAILED,
    );

    await expect(service.publish(activeMentor)).rejects.toBeInstanceOf(
      PublicationNotEligibleError,
    );
    expect(mentorsRepository.updatePublicationStatus).not.toHaveBeenCalled();
  });

  it('publishes eligible draft profile', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(baseProfile);
    usersService.findById.mockResolvedValue(userRecord);
    mentorsRepository.updatePublicationStatus.mockResolvedValue({
      ...baseProfile,
      publicationStatus: PublicationStatus.PUBLISHED,
    });

    await expect(service.publish(activeMentor)).resolves.toBeUndefined();
    expect(mentorsRepository.updatePublicationStatus).toHaveBeenCalledWith(
      'user-1',
      PublicationStatus.PUBLISHED,
    );
  });

  it('rejects publish when already published', async () => {
    mentorsRepository.findByUserId.mockResolvedValue({
      ...baseProfile,
      publicationStatus: PublicationStatus.PUBLISHED,
    });

    await expect(service.publish(activeMentor)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('unpublishes a published profile', async () => {
    mentorsRepository.findByUserId.mockResolvedValue({
      ...baseProfile,
      publicationStatus: PublicationStatus.PUBLISHED,
    });
    mentorsRepository.updatePublicationStatus.mockResolvedValue({
      ...baseProfile,
      publicationStatus: PublicationStatus.UNPUBLISHED,
    });

    await expect(service.unpublish(activeMentor)).resolves.toBeUndefined();
    expect(mentorsRepository.updatePublicationStatus).toHaveBeenCalledWith(
      'user-1',
      PublicationStatus.UNPUBLISHED,
    );
  });

  it('rejects unpublish when profile is not published', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(baseProfile);

    await expect(service.unpublish(activeMentor)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('is bookable only for published verified mentors with availability', () => {
    const eligibleInput = {
      user: userRecord,
      profile: {
        ...baseProfile,
        publicationStatus: PublicationStatus.PUBLISHED,
      },
      identityVerificationStatus: VerificationStatus.VERIFIED,
      hasAvailability: true,
    };

    expect(service.isBookable(eligibleInput)).toBe(true);

    expect(
      service.isBookable({
        ...eligibleInput,
        profile: {
          ...eligibleInput.profile,
          publicationStatus: PublicationStatus.DRAFT,
        },
      }),
    ).toBe(false);

    expect(
      service.isBookable({
        ...eligibleInput,
        identityVerificationStatus: VerificationStatus.FAILED,
      }),
    ).toBe(false);

    expect(
      service.isBookable({
        ...eligibleInput,
        user: { ...userRecord, status: UserStatus.SUSPENDED },
      }),
    ).toBe(false);

    expect(
      service.isBookable({
        ...eligibleInput,
        hasAvailability: false,
      }),
    ).toBe(false);
  });

  it('throws when profile is missing', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(null);

    await expect(service.getEligibility(activeMentor)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
