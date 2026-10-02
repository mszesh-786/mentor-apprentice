import { PublicationEligibility } from '../domain/publication-eligibility';
import { PublicationEligibilityResponseDto } from '../dto/publication-eligibility-response.dto';

export function toPublicationEligibilityResponse(
  eligibility: PublicationEligibility,
): PublicationEligibilityResponseDto {
  return {
    eligible: eligibility.eligible,
    requirements: eligibility.requirements.map((requirement) => ({
      code: requirement.code,
      label: requirement.label,
      satisfied: requirement.satisfied,
    })),
  };
}
