import { VerificationStatus, VerificationType } from '@prisma/client';
import { IdentityVerification } from '../domain/verification';
import { IdentityVerificationResponseDto } from '../dto/identity-verification-response.dto';

export function toIdentityVerificationResponse(
  verification: IdentityVerification | null,
): IdentityVerificationResponseDto {
  if (!verification) {
    return {
      status: VerificationStatus.NOT_STARTED,
      type: VerificationType.IDENTITY,
      provider: null,
      submittedAt: null,
      verifiedAt: null,
    };
  }

  return {
    status: verification.status,
    type: verification.type,
    provider: verification.provider,
    submittedAt: verification.submittedAt?.toISOString() ?? null,
    verifiedAt: verification.verifiedAt?.toISOString() ?? null,
  };
}
