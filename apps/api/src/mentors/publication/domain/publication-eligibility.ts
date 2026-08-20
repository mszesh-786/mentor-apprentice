export type PublicationRequirementCode =
  | 'ACTIVE_ACCOUNT'
  | 'EMAIL_VERIFIED'
  | 'IDENTITY_VERIFIED'
  | 'PROFILE_NAME'
  | 'BIOGRAPHY'
  | 'LANGUAGE'
  | 'EXPERTISE'
  | 'AVAILABILITY';

export type PublicationRequirement = {
  code: PublicationRequirementCode;
  label: string;
  satisfied: boolean;
};

export type PublicationEligibility = {
  eligible: boolean;
  requirements: PublicationRequirement[];
};
