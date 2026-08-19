import { BadRequestException, Injectable } from '@nestjs/common';
import { DayOfWeek, UserStatus } from '@prisma/client';
import { AuthUser } from '../../../auth/auth-user';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../common/errors/domain-error';
import { MentorsRepository } from '../../persistence/mentors.repository';
import {
  AvailabilityRule,
  AvailabilityRuleInput,
} from '../domain/availability-rule';
import { AvailabilityRepository } from '../persistence/availability.repository';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly mentorsRepository: MentorsRepository,
  ) {}

  async getMyRules(user: AuthUser): Promise<AvailabilityRule[]> {
    const profile = await this.requireOwnProfile(user);
    return this.availabilityRepository.findByMentorProfileId(profile.id);
  }

  async replaceMyRules(
    user: AuthUser,
    inputs: AvailabilityRuleInput[],
  ): Promise<AvailabilityRule[]> {
    this.assertActive(user);
    const profile = await this.requireOwnProfile(user);
    const normalized = this.normalizeRules(inputs, profile.timezone);

    return this.availabilityRepository.replaceForMentorProfile(
      profile.id,
      normalized,
    );
  }

  async removeMyRule(
    user: AuthUser,
    ruleId: string,
  ): Promise<AvailabilityRule[]> {
    this.assertActive(user);
    const profile = await this.requireOwnProfile(user);
    const rule = await this.availabilityRepository.findById(ruleId);

    if (!rule || rule.mentorProfileId !== profile.id) {
      throw new NotFoundError('Availability rule not found');
    }

    await this.availabilityRepository.deleteById(ruleId);
    return this.availabilityRepository.findByMentorProfileId(profile.id);
  }

  async hasActiveAvailability(mentorProfileId: string): Promise<boolean> {
    const count =
      await this.availabilityRepository.countActiveByMentorProfileId(
        mentorProfileId,
      );
    return count > 0;
  }

  normalizeRules(
    inputs: AvailabilityRuleInput[],
    profileTimezone: string | null,
  ): Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    timezone: string;
  }> {
    const defaultTimezone = profileTimezone ?? 'UTC';
    const normalized = inputs.map((input) => ({
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      timezone: input.timezone ?? defaultTimezone,
    }));

    for (const rule of normalized) {
      if (!this.isValidWindow(rule.startTime, rule.endTime)) {
        throw new BadRequestException(
          'Availability window startTime must be before endTime',
        );
      }
    }

    this.assertNoDuplicateStarts(normalized);
    this.assertNoOverlaps(normalized);

    return normalized;
  }

  private assertNoDuplicateStarts(
    rules: Array<{ dayOfWeek: DayOfWeek; startTime: string }>,
  ): void {
    const seen = new Set<string>();
    for (const rule of rules) {
      const key = `${rule.dayOfWeek}:${rule.startTime}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          'Duplicate availability windows are not allowed for the same day and start time',
        );
      }
      seen.add(key);
    }
  }

  private assertNoOverlaps(
    rules: Array<{
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
    }>,
  ): void {
    const byDay = new Map<DayOfWeek, typeof rules>();

    for (const rule of rules) {
      const dayRules = byDay.get(rule.dayOfWeek) ?? [];
      dayRules.push(rule);
      byDay.set(rule.dayOfWeek, dayRules);
    }

    for (const dayRules of byDay.values()) {
      const sorted = [...dayRules].sort(
        (left, right) =>
          this.toMinutes(left.startTime) - this.toMinutes(right.startTime),
      );

      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1];
        const current = sorted[index];
        if (
          this.toMinutes(current.startTime) < this.toMinutes(previous.endTime)
        ) {
          throw new BadRequestException(
            'Overlapping availability windows are not allowed on the same day',
          );
        }
      }
    }
  }

  private isValidWindow(startTime: string, endTime: string): boolean {
    return this.toMinutes(startTime) < this.toMinutes(endTime);
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async requireOwnProfile(user: AuthUser) {
    const profile = await this.mentorsRepository.findByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Mentor profile not found');
    }
    return profile;
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
