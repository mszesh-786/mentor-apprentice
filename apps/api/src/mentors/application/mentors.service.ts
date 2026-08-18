import { BadRequestException, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { LanguagesService } from '../../languages/application/languages.service';
import { UsersService } from '../../users/users.service';
import { CreateMentorProfileDto } from '../dto/create-mentor-profile.dto';
import { UpdateMentorProfileDto } from '../dto/update-mentor-profile.dto';
import { MentorProfile } from '../domain/mentor-profile';
import { MentorsRepository } from '../persistence/mentors.repository';

@Injectable()
export class MentorsService {
  constructor(
    private readonly mentorsRepository: MentorsRepository,
    private readonly usersService: UsersService,
    private readonly languagesService: LanguagesService,
  ) {}

  async createProfile(
    user: AuthUser,
    dto: CreateMentorProfileDto,
  ): Promise<MentorProfile> {
    this.assertActive(user);
    this.assertCurrencyWithRate(dto.hourlyRate, dto.currency);

    const existing = await this.mentorsRepository.findByUserId(user.id);
    if (existing) {
      throw new ConflictError('Mentor profile already exists');
    }

    if (dto.displayName !== undefined) {
      await this.usersService.updateDisplayName(user.id, dto.displayName);
    }

    return this.mentorsRepository.create({
      userId: user.id,
      headline: dto.headline,
      biography: dto.biography,
      generalLocation: dto.generalLocation,
      timezone: dto.timezone,
      profilePhotoUrl: dto.profilePhotoUrl,
      hourlyRate: dto.hourlyRate,
      currency: dto.currency,
    });
  }

  async getMyProfile(user: AuthUser): Promise<MentorProfile> {
    const profile = await this.mentorsRepository.findByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Mentor profile not found');
    }
    return profile;
  }

  async updateMyProfile(
    user: AuthUser,
    dto: UpdateMentorProfileDto,
  ): Promise<MentorProfile> {
    this.assertActive(user);
    this.assertCurrencyWithRate(
      dto.hourlyRate === null ? undefined : dto.hourlyRate,
      dto.currency === null ? undefined : dto.currency,
    );

    const existing = await this.mentorsRepository.findByUserId(user.id);
    if (!existing) {
      throw new NotFoundError('Mentor profile not found');
    }

    if (dto.displayName !== undefined) {
      await this.usersService.updateDisplayName(user.id, dto.displayName);
    }

    return this.mentorsRepository.update(user.id, {
      headline: dto.headline,
      biography: dto.biography,
      generalLocation: dto.generalLocation,
      timezone: dto.timezone,
      profilePhotoUrl: dto.profilePhotoUrl,
      hourlyRate: dto.hourlyRate,
      currency: dto.currency,
    });
  }

  async setMyLanguages(
    user: AuthUser,
    languageIds: string[],
  ): Promise<MentorProfile> {
    this.assertActive(user);

    const profile = await this.mentorsRepository.findByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Mentor profile not found');
    }

    const uniqueIds = [...new Set(languageIds)];
    if (uniqueIds.length > 0) {
      await this.languagesService.assertActiveIds(uniqueIds);
    }

    await this.mentorsRepository.replaceLanguages(profile.id, uniqueIds);

    const updated = await this.mentorsRepository.findByUserId(user.id);
    if (!updated) {
      throw new NotFoundError('Mentor profile not found');
    }

    return updated;
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }

  private assertCurrencyWithRate(hourlyRate?: number, currency?: string): void {
    if (hourlyRate !== undefined && currency === undefined) {
      throw new BadRequestException(
        'currency is required when hourlyRate is set',
      );
    }
  }
}
