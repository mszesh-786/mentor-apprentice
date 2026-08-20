import { Injectable } from '@nestjs/common';
import {
  ExpertiseStatus,
  PublicationStatus,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { AuthUser } from '../../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PublicationNotEligibleError,
} from '../../../common/errors/domain-error';
import { UserRecord } from '../../../users/users.types';
import { UsersService } from '../../../users/users.service';
import { VerificationService } from '../../../verification/application/verification.service';
import { AvailabilityService } from '../../availability/application/availability.service';
import { MentorProfile } from '../../domain/mentor-profile';
import { MentorsRepository } from '../../persistence/mentors.repository';
import {
  PublicationEligibility,
  PublicationRequirement,
} from '../domain/publication-eligibility';

type PublicationEvaluationInput = {
  user: UserRecord;
  profile: MentorProfile;
  identityVerificationStatus: VerificationStatus;
  hasAvailability: boolean;
};

@Injectable()
export class PublicationService {
  constructor(
    private readonly mentorsRepository: MentorsRepository,
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async getEligibility(user: AuthUser): Promise<PublicationEligibility> {
    const input = await this.buildEvaluationInput(user);
    return this.evaluatePublicationEligibility(input);
  }

  async publish(user: AuthUser): Promise<void> {
    this.assertActive(user);

    const profile = await this.mentorsRepository.findByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Mentor profile not found');
    }

    if (profile.publicationStatus === PublicationStatus.PUBLISHED) {
      throw new ConflictError('Mentor profile is already published');
    }

    if (profile.publicationStatus === PublicationStatus.SUSPENDED) {
      throw new ForbiddenError('Suspended mentor profiles cannot be published');
    }

    if (
      profile.publicationStatus !== PublicationStatus.DRAFT &&
      profile.publicationStatus !== PublicationStatus.UNPUBLISHED
    ) {
      throw new ConflictError('Mentor profile cannot be published');
    }

    const input = await this.buildEvaluationInput(user, profile);
    const eligibility = this.evaluatePublicationEligibility(input);
    if (!eligibility.eligible) {
      throw new PublicationNotEligibleError(
        undefined,
        eligibility.requirements,
      );
    }

    await this.mentorsRepository.updatePublicationStatus(
      user.id,
      PublicationStatus.PUBLISHED,
    );
  }

  async unpublish(user: AuthUser): Promise<void> {
    this.assertActive(user);

    const profile = await this.mentorsRepository.findByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Mentor profile not found');
    }

    if (profile.publicationStatus !== PublicationStatus.PUBLISHED) {
      throw new ConflictError('Mentor profile is not published');
    }

    await this.mentorsRepository.updatePublicationStatus(
      user.id,
      PublicationStatus.UNPUBLISHED,
    );
  }

  evaluatePublicationEligibility(
    input: PublicationEvaluationInput,
  ): PublicationEligibility {
    const requirements = this.buildRequirements(input);
    return {
      eligible: requirements.every((requirement) => requirement.satisfied),
      requirements,
    };
  }

  isBookable(input: PublicationEvaluationInput): boolean {
    if (input.profile.publicationStatus !== PublicationStatus.PUBLISHED) {
      return false;
    }

    return (
      input.user.status === UserStatus.ACTIVE &&
      input.identityVerificationStatus === VerificationStatus.VERIFIED &&
      this.hasActiveExpertise(input.profile) &&
      input.hasAvailability
    );
  }

  buildProfilePublicationFields(
    input: PublicationEvaluationInput,
  ): Pick<MentorProfile, 'publicationEligibility' | 'isBookable'> {
    return {
      publicationEligibility: this.evaluatePublicationEligibility(input),
      isBookable: this.isBookable(input),
    };
  }

  private async buildEvaluationInput(
    user: AuthUser,
    profile?: MentorProfile,
  ): Promise<PublicationEvaluationInput> {
    const resolvedProfile =
      profile ?? (await this.mentorsRepository.findByUserId(user.id));
    if (!resolvedProfile) {
      throw new NotFoundError('Mentor profile not found');
    }

    const userRecord = await this.usersService.findById(user.id);
    if (!userRecord) {
      throw new NotFoundError('User not found');
    }

    const [identityVerificationStatus, hasAvailability] = await Promise.all([
      this.verificationService.getIdentityStatus(user.id),
      this.availabilityService.hasActiveAvailability(resolvedProfile.id),
    ]);

    return {
      user: userRecord,
      profile: resolvedProfile,
      identityVerificationStatus,
      hasAvailability,
    };
  }

  private buildRequirements(
    input: PublicationEvaluationInput,
  ): PublicationRequirement[] {
    return [
      {
        code: 'ACTIVE_ACCOUNT',
        label: 'Account is active',
        satisfied: input.user.status === UserStatus.ACTIVE,
      },
      {
        code: 'EMAIL_VERIFIED',
        label: 'Email is verified',
        satisfied: input.user.emailVerified,
      },
      {
        code: 'IDENTITY_VERIFIED',
        label: 'Identity is verified',
        satisfied:
          input.identityVerificationStatus === VerificationStatus.VERIFIED,
      },
      {
        code: 'PROFILE_NAME',
        label: 'Profile name is set',
        satisfied: this.hasText(input.user.displayName),
      },
      {
        code: 'BIOGRAPHY',
        label: 'Biography is provided',
        satisfied: this.hasText(input.profile.biography),
      },
      {
        code: 'LANGUAGE',
        label: 'At least one language is selected',
        satisfied: input.profile.languages.length > 0,
      },
      {
        code: 'EXPERTISE',
        label: 'At least one active skill expertise is added',
        satisfied: this.hasActiveExpertise(input.profile),
      },
      {
        code: 'AVAILABILITY',
        label: 'At least one availability window is configured',
        satisfied: input.hasAvailability,
      },
    ];
  }

  private hasActiveExpertise(profile: MentorProfile): boolean {
    return profile.expertise.some(
      (entry) => entry.status === ExpertiseStatus.ACTIVE,
    );
  }

  private hasText(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
