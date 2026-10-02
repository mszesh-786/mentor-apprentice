import {
  VerificationProvider,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';

export type IdentityVerification = {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  provider: VerificationProvider;
  submittedAt: Date | null;
  verifiedAt: Date | null;
};
