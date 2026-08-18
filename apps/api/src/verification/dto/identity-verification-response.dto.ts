import {
  VerificationProvider,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';

export class IdentityVerificationResponseDto {
  status!: VerificationStatus;
  type!: VerificationType;
  provider!: VerificationProvider | null;
  submittedAt!: string | null;
  verifiedAt!: string | null;
}
