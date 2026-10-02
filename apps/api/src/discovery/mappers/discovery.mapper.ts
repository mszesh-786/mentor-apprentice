import {
  DiscoveryMentorCard,
  DiscoveryMentorDetail,
  DiscoveryMentorReviewPage,
} from '../domain/discovery';
import {
  DiscoveryMentorCardResponseDto,
  DiscoveryMentorDetailResponseDto,
  DiscoveryMentorReviewPageResponseDto,
} from '../dto/discovery-response.dto';

export function toDiscoveryMentorCardResponse(
  card: DiscoveryMentorCard,
): DiscoveryMentorCardResponseDto {
  return {
    id: card.id,
    displayName: card.displayName,
    headline: card.headline,
    bioExcerpt: card.bioExcerpt,
    profilePhotoUrl: card.profilePhotoUrl,
    generalLocation: card.generalLocation,
    languages: card.languages,
    expertise: card.expertise,
    hourlyRate: card.hourlyRate,
    currency: card.currency,
    hasAvailability: card.hasAvailability,
    identityVerified: true,
    matchReasons: card.matchReasons,
    averageRating: card.averageRating,
    reviewCount: card.reviewCount,
  };
}

export function toDiscoveryMentorDetailResponse(
  detail: DiscoveryMentorDetail,
): DiscoveryMentorDetailResponseDto {
  return {
    id: detail.id,
    userId: detail.userId,
    displayName: detail.displayName,
    headline: detail.headline,
    biography: detail.biography,
    profilePhotoUrl: detail.profilePhotoUrl,
    generalLocation: detail.generalLocation,
    timezone: detail.timezone,
    languages: detail.languages,
    expertise: detail.expertise,
    identityVerified: detail.identityVerified,
    availability: detail.availability,
    hourlyRate: detail.hourlyRate,
    currency: detail.currency,
    averageRating: detail.averageRating,
    reviewCount: detail.reviewCount,
    completedSessionCount: detail.completedSessionCount,
  };
}

export function toDiscoveryMentorReviewPageResponse(
  page: DiscoveryMentorReviewPage,
): DiscoveryMentorReviewPageResponseDto {
  return {
    items: page.items.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reviewerFirstName: review.reviewerFirstName,
      createdAt: review.createdAt.toISOString(),
    })),
    total: page.total,
  };
}
