import { BadRequestException } from '@nestjs/common';
import { Role, TeachingLevel, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import { BlocksService } from '../../blocks/application/blocks.service';
import { LanguagesService } from '../../languages/application/languages.service';
import { SkillsService } from '../../skills/application/skills.service';
import { DiscoveryMentorCard } from '../domain/discovery';
import { DiscoveryRepository } from '../persistence/discovery.repository';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService', () => {
  const apprentice: AuthUser = {
    id: 'apprentice-1',
    authProviderId: 'auth-apprentice',
    email: 'apprentice@example.com',
    emailVerified: true,
    displayName: 'Priya',
    status: UserStatus.ACTIVE,
    roles: [Role.APPRENTICE],
  };

  const card: DiscoveryMentorCard = {
    id: 'profile-1',
    userId: 'mentor-1',
    displayName: 'David',
    headline: 'Mechanic',
    generalLocation: 'Helsinki',
    languages: [{ id: 'lang-1', code: 'en', name: 'English' }],
    expertise: {
      skillId: 'skill-1',
      skillName: 'Basic Car Maintenance',
      yearsExperience: 30,
      teachingLevel: TeachingLevel.BEGINNER,
      description: null,
    },
    hourlyRate: '45.00',
    currency: 'EUR',
    hasAvailability: true,
    matchReasons: ['Teaches Basic Car Maintenance', 'Identity verified'],
  };

  let discoveryRepository: jest.Mocked<
    Pick<DiscoveryRepository, 'searchMentors' | 'findDiscoverableDetail'>
  >;
  let skillsService: jest.Mocked<Pick<SkillsService, 'assertActiveSkill'>>;
  let languagesService: jest.Mocked<Pick<LanguagesService, 'assertActiveIds'>>;
  let blocksService: jest.Mocked<Pick<BlocksService, 'getExcludedUserIds'>>;
  let analyticsService: jest.Mocked<
    Pick<AnalyticsService, 'recordSkillSearch' | 'recordMentorProfileView'>
  >;
  let service: DiscoveryService;

  beforeEach(() => {
    discoveryRepository = {
      searchMentors: jest.fn(),
      findDiscoverableDetail: jest.fn(),
    };
    skillsService = {
      assertActiveSkill: jest.fn().mockResolvedValue({
        id: 'skill-1',
        slug: 'basic-car-maintenance',
        name: 'Basic Car Maintenance',
      }),
    };
    languagesService = {
      assertActiveIds: jest.fn(),
    };
    blocksService = {
      getExcludedUserIds: jest.fn().mockResolvedValue([]),
    };
    analyticsService = {
      recordSkillSearch: jest.fn(),
      recordMentorProfileView: jest.fn(),
    };
    service = new DiscoveryService(
      discoveryRepository as unknown as DiscoveryRepository,
      skillsService as unknown as SkillsService,
      languagesService as unknown as LanguagesService,
      blocksService as unknown as BlocksService,
      analyticsService as unknown as AnalyticsService,
    );
  });

  it('searches mentors and records analytics', async () => {
    discoveryRepository.searchMentors.mockResolvedValue([card]);

    await expect(
      service.searchMentors(apprentice, { skillId: 'skill-1' }),
    ).resolves.toEqual([card]);

    expect(discoveryRepository.searchMentors).toHaveBeenCalledWith({
      skillId: 'skill-1',
      languageId: undefined,
      teachingLevel: undefined,
      excludeUserIds: [],
    });
    expect(analyticsService.recordSkillSearch).toHaveBeenCalledWith(
      'apprentice-1',
      expect.objectContaining({ skillId: 'skill-1', resultCount: 1 }),
    );
  });

  it('passes blocked user exclusions into search', async () => {
    blocksService.getExcludedUserIds.mockResolvedValue(['blocked-user']);
    discoveryRepository.searchMentors.mockResolvedValue([]);

    await service.searchMentors(apprentice, {
      skillId: 'skill-1',
      languageId: 'lang-1',
      teachingLevel: TeachingLevel.BEGINNER,
    });

    expect(languagesService.assertActiveIds).toHaveBeenCalledWith(['lang-1']);
    expect(discoveryRepository.searchMentors).toHaveBeenCalledWith({
      skillId: 'skill-1',
      languageId: 'lang-1',
      teachingLevel: TeachingLevel.BEGINNER,
      excludeUserIds: ['blocked-user'],
    });
  });

  it('records mentor profile view analytics', async () => {
    discoveryRepository.findDiscoverableDetail.mockResolvedValue({
      id: 'profile-1',
      displayName: 'David',
      headline: 'Mechanic',
      biography: 'Bio',
      generalLocation: 'Helsinki',
      timezone: 'Europe/Helsinki',
      languages: [],
      expertise: [],
      identityVerified: true,
      availability: [],
      hourlyRate: null,
      currency: null,
    });

    await service.getMentorDetail(apprentice, 'profile-1');

    expect(analyticsService.recordMentorProfileView).toHaveBeenCalledWith(
      'apprentice-1',
      { mentorProfileId: 'profile-1' },
    );
  });

  it('rejects invalid skill', async () => {
    skillsService.assertActiveSkill.mockRejectedValue(
      new BadRequestException('Skill is not available'),
    );

    await expect(
      service.searchMentors(apprentice, { skillId: 'bad' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
