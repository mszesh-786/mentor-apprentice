import { PublicationRequirementCode } from '../domain/publication-eligibility';

export class PublicationRequirementResponseDto {
  code!: PublicationRequirementCode;
  label!: string;
  satisfied!: boolean;
}

export class PublicationEligibilityResponseDto {
  eligible!: boolean;
  requirements!: PublicationRequirementResponseDto[];
}
