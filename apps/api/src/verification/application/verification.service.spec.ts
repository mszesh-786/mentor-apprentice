import { BadRequestException } from '@nestjs/common';
import {
  Role,
  UserStatus,
  VerificationProvider,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
} from '../../common/errors/domain-error';
import { IdentityVerification } from '../domain/verification';
import { VerificationRepository } from '../persistence/verification.repository';
import { VerificationService } from './verification.service';

describe('VerificationService', () => {
  const activeMentor: AuthUser = {
    id: 'user-1',
    authProviderId: 'auth-1',
    email: 'mentor@example.com',
    emailVerified: true,
    displayName: 'David',
    status: UserStatus.ACTIVE,
    roles: [Role.MENTOR],
  };

  const pending: IdentityVerification = {
    id: 'ver-1',
    userId: 'user-1',
    type: VerificationType.IDENTITY,
    status: VerificationStatus.PENDING,
    provider: VerificationProvider.STUB,
    submittedAt: new Date('2026-01-02T00:00:00.000Z'),
    verifiedAt: null,
  };

  let repository: jest.Mocked<
    Pick<
      VerificationRepository,
      'findIdentityByUserId' | 'createIdentity' | 'updateIdentity'
    >
  >;
  let service: VerificationService;

  beforeEach(() => {
    repository = {
      findIdentityByUserId: jest.fn(),
      createIdentity: jest.fn(),
      updateIdentity: jest.fn(),
    };
    service = new VerificationService(
      repository as unknown as VerificationRepository,
    );
    delete process.env.ALLOW_VERIFICATION_STUB;
  });

  it('returns NOT_STARTED when no identity verification exists', async () => {
    repository.findIdentityByUserId.mockResolvedValue(null);

    await expect(service.getIdentityStatus('user-1')).resolves.toBe(
      VerificationStatus.NOT_STARTED,
    );
  });

  it('treats only VERIFIED as identity verified', async () => {
    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.FAILED,
    });
    await expect(service.isIdentityVerified('user-1')).resolves.toBe(false);

    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.REQUIRES_REVIEW,
    });
    await expect(service.isIdentityVerified('user-1')).resolves.toBe(false);

    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.VERIFIED,
    });
    await expect(service.isIdentityVerified('user-1')).resolves.toBe(true);
  });

  it('starts identity verification as PENDING', async () => {
    repository.findIdentityByUserId.mockResolvedValue(null);
    repository.createIdentity.mockResolvedValue(pending);

    await expect(service.startIdentity(activeMentor)).resolves.toEqual(pending);
    expect(repository.createIdentity).toHaveBeenCalledWith('user-1');
  });

  it('rejects a second start while PENDING', async () => {
    repository.findIdentityByUserId.mockResolvedValue(pending);

    await expect(service.startIdentity(activeMentor)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('rejects start when already VERIFIED', async () => {
    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.VERIFIED,
    });

    await expect(service.startIdentity(activeMentor)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('rejects start when REQUIRES_REVIEW', async () => {
    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.REQUIRES_REVIEW,
    });

    await expect(service.startIdentity(activeMentor)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('allows retry after FAILED', async () => {
    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.FAILED,
    });
    repository.updateIdentity.mockResolvedValue(pending);

    await expect(service.startIdentity(activeMentor)).resolves.toEqual(pending);
    expect(repository.updateIdentity).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ status: VerificationStatus.PENDING }),
    );
  });

  it('applies stub VERIFIED only from PENDING', async () => {
    repository.findIdentityByUserId.mockResolvedValue(pending);
    repository.updateIdentity.mockResolvedValue({
      ...pending,
      status: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
    });

    const result = await service.applyStubResult(
      activeMentor,
      VerificationStatus.VERIFIED,
    );

    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(repository.updateIdentity).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ status: VerificationStatus.VERIFIED }),
    );
  });

  it('rejects stub result when not PENDING', async () => {
    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.FAILED,
    });

    await expect(
      service.applyStubResult(activeMentor, VerificationStatus.VERIFIED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects stub VERIFIED from FAILED or REQUIRES_REVIEW as verified shortcut', async () => {
    repository.findIdentityByUserId.mockResolvedValue({
      ...pending,
      status: VerificationStatus.REQUIRES_REVIEW,
    });

    await expect(
      service.applyStubResult(activeMentor, VerificationStatus.VERIFIED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects start when account is suspended', async () => {
    await expect(
      service.startIdentity({
        ...activeMentor,
        status: UserStatus.SUSPENDED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects stub result when stub is disabled', async () => {
    process.env.ALLOW_VERIFICATION_STUB = 'false';
    repository.findIdentityByUserId.mockResolvedValue(pending);

    await expect(
      service.applyStubResult(activeMentor, VerificationStatus.VERIFIED),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
