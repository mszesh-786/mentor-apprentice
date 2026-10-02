import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type {
  AvailabilitySlot,
  BookingDuration,
  DiscoveryMentorCard,
  DiscoveryMentorDetail,
  DiscoveryMentorReviewPage,
  DiscoverySearchParams,
} from '@/api/types'

export const discoveryKeys = {
  search: (params: DiscoverySearchParams) =>
    ['discovery', 'mentors', params] as const,
  detail: (profileId: string) =>
    ['discovery', 'mentors', profileId] as const,
  reviews: (profileId: string) =>
    ['discovery', 'mentors', profileId, 'reviews'] as const,
  slots: (
    profileId: string,
    from: string,
    to: string,
    durationMinutes: BookingDuration,
  ) =>
    ['discovery', 'mentors', profileId, 'slots', from, to, durationMinutes] as const,
}

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function useDiscoverMentors(params: DiscoverySearchParams) {
  return useQuery({
    queryKey: discoveryKeys.search(params),
    queryFn: () =>
      apiFetch<DiscoveryMentorCard[]>(
        `/discovery/mentors${toQuery({
          q: params.q,
          categoryId: params.categoryId,
          skillId: params.skillId,
          languageId: params.languageId,
          teachingLevel: params.teachingLevel,
        })}`,
      ),
    placeholderData: keepPreviousData,
  })
}

const REVIEWS_PAGE_SIZE = 5

export function useMentorReviews(profileId: string) {
  return useInfiniteQuery({
    queryKey: discoveryKeys.reviews(profileId),
    queryFn: ({ pageParam }) =>
      apiFetch<DiscoveryMentorReviewPage>(
        `/discovery/mentors/${profileId}/reviews${toQuery({
          offset: pageParam,
          limit: REVIEWS_PAGE_SIZE,
        })}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0)
      return loaded < lastPage.total ? loaded : undefined
    },
    enabled: Boolean(profileId),
  })
}

export function useDiscoveryMentor(profileId: string) {
  return useQuery({
    queryKey: discoveryKeys.detail(profileId),
    queryFn: () =>
      apiFetch<DiscoveryMentorDetail>(`/discovery/mentors/${profileId}`),
    enabled: Boolean(profileId),
  })
}

export function useMentorSlots(
  profileId: string,
  from: string,
  to: string,
  durationMinutes: BookingDuration,
  enabled = true,
) {
  return useQuery({
    queryKey: discoveryKeys.slots(profileId, from, to, durationMinutes),
    queryFn: () =>
      apiFetch<AvailabilitySlot[]>(
        `/discovery/mentors/${profileId}/slots${toQuery({
          from,
          to,
          durationMinutes,
        })}`,
      ),
    enabled: Boolean(profileId) && enabled,
  })
}
