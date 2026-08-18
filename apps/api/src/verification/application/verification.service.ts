import { BadRequestException, Injectable } from '@nestjs/common';
import { UserStatus, VerificationStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
} from '../../common/errors/domain-error';
import { IdentityVerification } from '../domain/verification';
import { VerificationRepository } from '../persistence/verification.repository';

const stubOutcomes = new Set<VerificationStatus>([
  VerificationStatus.VERIFIED,
  VerificationStatus.FAILED,
  VerificationStatus.REQUIRES_REVIEW,
]);

@Injectable()
export class VerificationService {
  constructor(
    private readonly verificationRepository: VerificationRepository,
  ) {}

  async getIdentity(userId: string): Promise<IdentityVerification | null> {
    return this.verificationRepository.findIdentityByUserId(userId);
  }

  async getIdentityStatus(userId: string): Promise<VerificationStatus> {
    const verification = await this.getIdentity(userId);
    return verification?.status ?? VerificationStatus.NOT_STARTED;
  }

  async isIdentityVerified(userId: string): Promise<boolean> {
    const status = await this.getIdentityStatus(userId);
    return status === VerificationStatus.VERIFIED;
  }

  async startIdentity(user: AuthUser): Promise<IdentityVerification> {
    this.assertActive(user);

    const existing = await this.verificationRepository.findIdentityByUserId(
      user.id,
    );

    if (!existing) {
      return this.verificationRepository.createIdentity(user.id);
    }

    if (existing.status === VerificationStatus.PENDING) {
      throw new ConflictError('Identity verification is already pending');
    }

    if (existing.status === VerificationStatus.VERIFIED) {
      throw new ConflictError('Identity is already verified');
    }

    if (existing.status === VerificationStatus.REQUIRES_REVIEW) {
      throw new ConflictError(
        'Identity verification requires administrator review',
      );
    }

    return this.verificationRepository.updateIdentity(user.id, {
      status: VerificationStatus.PENDING,
      submittedAt: new Date(),
      verifiedAt: null,
    });
  }

  async applyStubResult(
    user: AuthUser,
    status: VerificationStatus,
  ): Promise<IdentityVerification> {
    this.assertActive(user);

    if (process.env.ALLOW_VERIFICATION_STUB === 'false') {
      throw new ForbiddenError('Verification stub is disabled');
    }

    if (!stubOutcomes.has(status)) {
      throw new BadRequestException('Invalid stub verification status');
    }

    const existing = await this.verificationRepository.findIdentityByUserId(
      user.id,
    );
    if (!existing || existing.status !== VerificationStatus.PENDING) {
      throw new BadRequestException(
        'Stub result is only allowed for a pending identity verification',
      );
    }

    return this.verificationRepository.updateIdentity(user.id, {
      status,
      verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
    });
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
