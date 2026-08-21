import { ApprenticeProfile } from '../domain/apprentice-profile';
import { ApprenticeProfileResponseDto } from '../dto/apprentice-profile-response.dto';

export function toApprenticeProfileResponse(
  profile: ApprenticeProfile,
): ApprenticeProfileResponseDto {
  return {
    id: profile.id,
    userId: profile.userId,
    shortBio: profile.shortBio,
    generalLocation: profile.generalLocation,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
