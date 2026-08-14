import { MentorProfile } from '../domain/mentor-profile';
import { MentorProfileResponseDto } from '../dto/mentor-profile-response.dto';

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
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
