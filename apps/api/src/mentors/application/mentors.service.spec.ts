import { BadRequestException } from '@nestjs/common';
import {
  CatalogueStatus,
  ExpertiseStatus,
  PublicationStatus,
  Role,
  TeachingLevel,
  UserStatus,
} from '@prisma/client';
import { MentorsService } from './mentors.service';
import { MentorsRepository } from '../persistence/mentors.repository';
import { UsersService } from '../../users/users.service';
import { LanguagesService } from '../../languages/application/languages.service';
import { SkillsService } from '../../skills/application/skills.service';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { MentorProfile } from '../domain/mentor-profile';
import { MentorExpertise } from '../domain/mentor-expertise';

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

  const skill = {
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
    expertise: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const expertise: MentorExpertise = {
    id: 'exp-1',
    mentorProfileId: 'profile-1',
    skillId: 'skill-1',
    yearsExperience: 32,
    description: 'Workshop mechanic',
    teachingLevel: TeachingLevel.BEGINNER,
    status: ExpertiseStatus.ACTIVE,
    skill,
  };

  let mentorsRepository: jest.Mocked<
    Pick<
      MentorsRepository,
      | 'findByUserId'
      | 'create'
      | 'update'
      | 'replaceLanguages'
      | 'findExpertiseByMentorAndSkill'
      | 'findExpertiseById'
      | 'createExpertise'
      | 'updateExpertise'
      | 'deleteExpertise'
    >
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'updateDisplayName'>>;
  let languagesService: jest.Mocked<Pick<LanguagesService, 'assertActiveIds'>>;
  let skillsService: jest.Mocked<Pick<SkillsService, 'assertActiveSkill'>>;
  let service: MentorsService;

  beforeEach(() => {
    mentorsRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      replaceLanguages: jest.fn(),
      findExpertiseByMentorAndSkill: jest.fn(),
      findExpertiseById: jest.fn(),
      createExpertise: jest.fn(),
      updateExpertise: jest.fn(),
      deleteExpertise: jest.fn(),
    };
    usersService = {
      updateDisplayName: jest.fn(),
    };
    languagesService = {
      assertActiveIds: jest.fn(),
    };
    skillsService = {
      assertActiveSkill: jest.fn(),
    };
    service = new MentorsService(
      mentorsRepository as unknown as MentorsRepository,
      usersService as unknown as UsersService,
      languagesService as unknown as LanguagesService,
      skillsService as unknown as SkillsService,
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

  it('adds expertise for an active skill', async () => {
    mentorsRepository.findByUserId
      .mockResolvedValueOnce(draftProfile)
      .mockResolvedValueOnce({ ...draftProfile, expertise: [expertise] });
    skillsService.assertActiveSkill.mockResolvedValue(skill);
    mentorsRepository.findExpertiseByMentorAndSkill.mockResolvedValue(null);

    const result = await service.addExpertise(activeMentor, {
      skillId: 'skill-1',
      yearsExperience: 32,
      description: 'Workshop mechanic',
      teachingLevel: TeachingLevel.BEGINNER,
    });

    expect(mentorsRepository.createExpertise).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorProfileId: 'profile-1',
        skillId: 'skill-1',
      }),
    );
    expect(result.expertise).toHaveLength(1);
  });

  it('rejects duplicate mentor+skill expertise', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(draftProfile);
    skillsService.assertActiveSkill.mockResolvedValue(skill);
    mentorsRepository.findExpertiseByMentorAndSkill.mockResolvedValue(
      expertise,
    );

    await expect(
      service.addExpertise(activeMentor, {
        skillId: 'skill-1',
        yearsExperience: 10,
        teachingLevel: TeachingLevel.BEGINNER,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects expertise when skill is not active', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(draftProfile);
    skillsService.assertActiveSkill.mockRejectedValue(
      new BadRequestException('Skill is not available'),
    );

    await expect(
      service.addExpertise(activeMentor, {
        skillId: 'disabled-skill',
        yearsExperience: 5,
        teachingLevel: TeachingLevel.BEGINNER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects expertise when mentor profile is missing', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(null);

    await expect(
      service.addExpertise(activeMentor, {
        skillId: 'skill-1',
        yearsExperience: 5,
        teachingLevel: TeachingLevel.BEGINNER,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates own expertise', async () => {
    mentorsRepository.findByUserId
      .mockResolvedValueOnce(draftProfile)
      .mockResolvedValueOnce({
        ...draftProfile,
        expertise: [{ ...expertise, yearsExperience: 40 }],
      });
    mentorsRepository.findExpertiseById.mockResolvedValue(expertise);

    const result = await service.updateExpertise(activeMentor, 'exp-1', {
      yearsExperience: 40,
    });

    expect(mentorsRepository.updateExpertise).toHaveBeenCalledWith(
      'exp-1',
      expect.objectContaining({ yearsExperience: 40 }),
    );
    expect(result.expertise[0]?.yearsExperience).toBe(40);
  });

  it('rejects update of another mentor expertise', async () => {
    mentorsRepository.findByUserId.mockResolvedValue(draftProfile);
    mentorsRepository.findExpertiseById.mockResolvedValue({
      ...expertise,
      mentorProfileId: 'other-profile',
    });

    await expect(
      service.updateExpertise(activeMentor, 'exp-1', { yearsExperience: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mentorsRepository.updateExpertise).not.toHaveBeenCalled();
  });

  it('removes own expertise', async () => {
    mentorsRepository.findByUserId
      .mockResolvedValueOnce(draftProfile)
      .mockResolvedValueOnce(draftProfile);
    mentorsRepository.findExpertiseById.mockResolvedValue(expertise);

    await service.removeExpertise(activeMentor, 'exp-1');

    expect(mentorsRepository.deleteExpertise).toHaveBeenCalledWith('exp-1');
  });
});
