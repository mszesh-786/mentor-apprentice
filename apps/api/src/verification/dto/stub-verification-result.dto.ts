import { VerificationStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class StubVerificationResultDto {
  @IsIn([
    VerificationStatus.VERIFIED,
    VerificationStatus.FAILED,
    VerificationStatus.REQUIRES_REVIEW,
  ])
  status!:
    | typeof VerificationStatus.VERIFIED
    | typeof VerificationStatus.FAILED
    | typeof VerificationStatus.REQUIRES_REVIEW;
}
