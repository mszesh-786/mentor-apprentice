import { BadRequestException } from '@nestjs/common';
import { PublicationStatus, Role, UserStatus } from '@prisma/client';
import { MentorsService } from './mentors.service';
import { MentorsRepository } from '../persistence/mentors.repository';
import { UsersService } from '../../users/users.service';
import { LanguagesService } from '../../languages/application/languages.service';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { MentorProfile } from '../domain/mentor-profile';

describe('MentorsService', () => {
  const activeMentor: AuthUser = {
    id: 'user-1',
    authProviderId: 'auth-1',
    email: 'mentor@example.com',
    emailVerified: true,
    displayName: 'David',
    status: UserStatus.ACTIVE,
    roles: [Role.MENTOR],
  };

  const draftProfile: MentorProfile = {
    id: 'profile-1',
    userId: 'user-1',
    headline: 'Mechanic',
    biography: '30 years experience',
    generalLocation: 'Helsinki',
    timezone: 'Europe/Helsinki',
    profilePhotoUrl: null,
    hourlyRate: '45.00',
    currency: 'EUR',
    publicationStatus: PublicationStatus.DRAFT,
    languages: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let mentorsRepository: jest.Mocked<
    Pick<
      MentorsRepository,
      'findByUserId' | 'create' | 'update' | 'replaceLanguages'
    >
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'updateDisplayName'>>;
  let languagesService: jest.Mocked<Pick<LanguagesService, 'assertActiveIds'>>;
  let service: MentorsService;

  beforeEach(() => {
    mentorsRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      replaceLanguages: jest.fn(),
    };
    usersService = {
      updateDisplayName: jest.fn(),
    };
    languagesService = {
      assertActiveIds: jest.fn(),
    };
    service = new MentorsService(
      mentorsRepository as unknown as MentorsRepository,
      usersService as unknown as UsersService,
      languagesService as unknown as LanguagesService,
    );
  });

  it('creates a DRAFT mentor profile', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(null);
    mentorsRepository.create.mockResolvedValue(draftProfile);

    const result = await service.createProfile(activeMentor, {
      headline: 'Mechanic',
      biography: '30 years experience',
      generalLocation: 'Helsinki',
      timezone: 'Europe/Helsinki',
      hourlyRate: 45,
      currency: 'EUR',
    });

    expect(result.publicationStatus).toBe(PublicationStatus.DRAFT);
    expect(mentorsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', currency: 'EUR' }),
    );
  });

  it('rejects duplicate profile creation', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(draftProfile);

    await expect(
      service.createProfile(activeMentor, { headline: 'Again' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects create when account is suspended', async () => {
    await expect(
      service.createProfile(
        { ...activeMentor, status: UserStatus.SUSPENDED },
        { headline: 'Nope' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('requires currency when hourlyRate is set', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(null);

    await expect(
      service.createProfile(activeMentor, { hourlyRate: 40 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns own profile', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(draftProfile);

    await expect(service.getMyProfile(activeMentor)).resolves.toEqual(
      draftProfile,
    );
  });

  it('throws when profile is missing', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(null);

    await expect(service.getMyProfile(activeMentor)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('updates own profile', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(draftProfile);
    mentorsRepository.update.mockResolvedValue({
      ...draftProfile,
      headline: 'Senior mechanic',
    });

    const result = await service.updateMyProfile(activeMentor, {
      headline: 'Senior mechanic',
    });

    expect(result.headline).toBe('Senior mechanic');
    expect(mentorsRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ headline: 'Senior mechanic' }),
    );
  });

  it('replaces mentor languages', async () => {
    const profileWithLanguages: MentorProfile = {
      ...draftProfile,
      languages: [
        { id: 'lang-en', code: 'en', name: 'English', sortOrder: 1 },
        { id: 'lang-fi', code: 'fi', name: 'Finnish', sortOrder: 2 },
      ],
    };

    mentorsRepository.findByUserId
      .mockResolvedValueOnce(draftProfile)
      .mockResolvedValueOnce(profileWithLanguages);
    languagesService.assertActiveIds.mockResolvedValue(
      profileWithLanguages.languages,
    );

    const result = await service.setMyLanguages(activeMentor, [
      'lang-en',
      'lang-fi',
      'lang-en',
    ]);

    expect(languagesService.assertActiveIds).toHaveBeenCalledWith([
      'lang-en',
      'lang-fi',
    ]);
    expect(mentorsRepository.replaceLanguages).toHaveBeenCalledWith(
      'profile-1',
      ['lang-en', 'lang-fi'],
    );
    expect(result.languages).toHaveLength(2);
  });

  it('allows clearing mentor languages', async () => {
    mentorsRepository.findByUserId
      .mockResolvedValueOnce(draftProfile)
      .mockResolvedValueOnce({ ...draftProfile, languages: [] });

    const result = await service.setMyLanguages(activeMentor, []);

    expect(languagesService.assertActiveIds).not.toHaveBeenCalled();
    expect(mentorsRepository.replaceLanguages).toHaveBeenCalledWith(
      'profile-1',
      [],
    );
    expect(result.languages).toEqual([]);
  });

  it('rejects setting languages when profile is missing', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(null);

    await expect(
      service.setMyLanguages(activeMentor, ['lang-en']),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
