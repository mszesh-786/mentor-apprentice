import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type {
  AvailabilitySlot,
  BookingDuration,
  DiscoveryMentorCard,
  DiscoveryMentorDetail,
  DiscoverySearchParams,
} from '@/api/types'

export const discoveryKeys = {
  search: (params: DiscoverySearchParams) =>
    ['discovery', 'mentors', params] as const,
  detail: (profileId: string) =>
    ['discovery', 'mentors', profileId] as const,
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

export function useDiscoverMentors(params: DiscoverySearchParams | null) {
  return useQuery({
    queryKey: discoveryKeys.search(params ?? { skillId: '' }),
    queryFn: () =>
      apiFetch<DiscoveryMentorCard[]>(
        `/discovery/mentors${toQuery({
          skillId: params!.skillId,
          languageId: params!.languageId,
          teachingLevel: params!.teachingLevel,
        })}`,
      ),
    enabled: Boolean(params?.skillId),
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
