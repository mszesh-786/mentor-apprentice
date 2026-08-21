import {
  DiscoveryMentorCard,
  DiscoveryMentorDetail,
} from '../domain/discovery';
import {
  DiscoveryMentorCardResponseDto,
  DiscoveryMentorDetailResponseDto,
} from '../dto/discovery-response.dto';

export function toDiscoveryMentorCardResponse(
  card: DiscoveryMentorCard,
): DiscoveryMentorCardResponseDto {
  return {
    id: card.id,
    displayName: card.displayName,
    headline: card.headline,
    generalLocation: card.generalLocation,
    languages: card.languages,
    expertise: card.expertise,
    hourlyRate: card.hourlyRate,
    currency: card.currency,
    hasAvailability: card.hasAvailability,
    identityVerified: true,
    matchReasons: card.matchReasons,
  };
}

export function toDiscoveryMentorDetailResponse(
  detail: DiscoveryMentorDetail,
): DiscoveryMentorDetailResponseDto {
  return {
    id: detail.id,
    displayName: detail.displayName,
    headline: detail.headline,
    biography: detail.biography,
    generalLocation: detail.generalLocation,
    timezone: detail.timezone,
    languages: detail.languages,
    expertise: detail.expertise,
    identityVerified: detail.identityVerified,
    availability: detail.availability,
    hourlyRate: detail.hourlyRate,
    currency: detail.currency,
  };
}
