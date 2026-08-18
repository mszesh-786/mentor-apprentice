import { toLanguageResponse } from '../../languages/mappers/language.mapper';
import { toSkillResponse } from '../../skills/mappers/skill.mapper';
import { MentorExpertise } from '../domain/mentor-expertise';
import { MentorProfile } from '../domain/mentor-profile';
import { MentorExpertiseResponseDto } from '../dto/mentor-expertise-response.dto';
import { MentorProfileResponseDto } from '../dto/mentor-profile-response.dto';

export function toMentorExpertiseResponse(
  expertise: MentorExpertise,
): MentorExpertiseResponseDto {
  return {
    id: expertise.id,
    skillId: expertise.skillId,
    yearsExperience: expertise.yearsExperience,
    description: expertise.description,
    teachingLevel: expertise.teachingLevel,
    status: expertise.status,
    skill: toSkillResponse(expertise.skill),
  };
}

export function toMentorProfileResponse(
  profile: MentorProfile,
): MentorProfileResponseDto {
  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline,
    biography: profile.biography,
    generalLocation: profile.generalLocation,
    timezone: profile.timezone,
    profilePhotoUrl: profile.profilePhotoUrl,
    hourlyRate: profile.hourlyRate,
    currency: profile.currency,
    publicationStatus: profile.publicationStatus,
    languages: profile.languages.map(toLanguageResponse),
    expertise: profile.expertise.map(toMentorExpertiseResponse),
    identityVerification: { status: profile.identityVerificationStatus },
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
