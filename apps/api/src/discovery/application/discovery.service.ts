import { Injectable } from '@nestjs/common';
import { TeachingLevel, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import { BlocksService } from '../../blocks/application/blocks.service';
import { SkillsService } from '../../skills/application/skills.service';
import { LanguagesService } from '../../languages/application/languages.service';
import {
  DiscoveryMentorCard,
  DiscoveryMentorDetail,
  DiscoveryMentorReviewPage,
} from '../domain/discovery';
import { DiscoveryRepository } from '../persistence/discovery.repository';

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly discoveryRepository: DiscoveryRepository,
    private readonly skillsService: SkillsService,
    private readonly languagesService: LanguagesService,
    private readonly blocksService: BlocksService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async searchMentors(
    user: AuthUser,
    filters: {
      skillId?: string;
      categoryId?: string;
      q?: string;
      languageId?: string;
      teachingLevel?: TeachingLevel;
    },
  ): Promise<DiscoveryMentorCard[]> {
    this.assertActive(user);

    const skill = filters.skillId
      ? await this.skillsService.assertActiveSkill(filters.skillId)
      : null;
    if (filters.languageId) {
      await this.languagesService.assertActiveIds([filters.languageId]);
    }

    const excludeUserIds = await this.blocksService.getExcludedUserIds(user.id);
    const q = filters.q?.trim() || undefined;

    const results = await this.discoveryRepository.searchMentors({
      skillId: filters.skillId,
      categoryId: filters.categoryId,
      q,
      languageId: filters.languageId,
      teachingLevel: filters.teachingLevel,
      excludeUserIds,
    });

    if (skill) {
      await this.analyticsService.recordSkillSearch(user.id, {
        skillId: skill.id,
        languageId: filters.languageId,
        teachingLevel: filters.teachingLevel,
        resultCount: results.length,
      });
    }

    return results;
  }

  async listMentorReviews(
    user: AuthUser,
    profileId: string,
    page: { offset: number; limit: number },
  ): Promise<DiscoveryMentorReviewPage> {
    this.assertActive(user);

    const excludeUserIds = await this.blocksService.getExcludedUserIds(user.id);
    const detail = await this.discoveryRepository.findDiscoverableDetail(
      profileId,
      excludeUserIds,
    );
    if (!detail) {
      throw new NotFoundError('Mentor not found');
    }

    return this.discoveryRepository.findMentorReviews(profileId, page);
  }

  async getMentorDetail(
    user: AuthUser,
    profileId: string,
  ): Promise<DiscoveryMentorDetail> {
    this.assertActive(user);

    const excludeUserIds = await this.blocksService.getExcludedUserIds(user.id);
    const detail = await this.discoveryRepository.findDiscoverableDetail(
      profileId,
      excludeUserIds,
    );

    if (!detail) {
      throw new NotFoundError('Mentor not found');
    }

    await this.analyticsService.recordMentorProfileView(user.id, {
      mentorProfileId: profileId,
    });

    return detail;
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
