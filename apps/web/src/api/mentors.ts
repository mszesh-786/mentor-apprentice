import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/api/client'
import type {
  AvailabilityException,
  AvailabilityRule,
  AvailabilityRuleInput,
  CreateAvailabilityExceptionInput,
  ExpertiseInput,
  MentorProfile,
  ProfileInput,
} from '@/api/types'

export const mentorKeys = {
  me: ['mentors', 'me'] as const,
  availability: ['mentors', 'availability'] as const,
  availabilityExceptions: ['mentors', 'availability-exceptions'] as const,
  eligibility: ['mentors', 'eligibility'] as const,
}

export async function fetchMentorProfile(): Promise<MentorProfile | null> {
  try {
    return await apiFetch<MentorProfile>('/mentors/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function useMentorProfile() {
  return useQuery({
    queryKey: mentorKeys.me,
    queryFn: fetchMentorProfile,
  })
}

export function useCreateMentorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileInput) =>
      apiFetch<MentorProfile>('/mentors/profile', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useUpdateMentorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileInput) =>
      apiFetch<MentorProfile>('/mentors/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useSetMentorLanguages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (languageIds: string[]) =>
      apiFetch<MentorProfile>('/mentors/me/languages', {
        method: 'PUT',
        body: JSON.stringify({ languageIds }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useAddExpertise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ExpertiseInput) =>
      apiFetch<MentorProfile>('/mentors/me/expertise', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useRemoveExpertise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (expertiseId: string) =>
      apiFetch<MentorProfile>(`/mentors/me/expertise/${expertiseId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useMentorAvailability() {
  return useQuery({
    queryKey: mentorKeys.availability,
    queryFn: () => apiFetch<AvailabilityRule[]>('/mentors/me/availability'),
  })
}

export function useSetAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rules: AvailabilityRuleInput[]) =>
      apiFetch<AvailabilityRule[]>('/mentors/me/availability', {
        method: 'PUT',
        body: JSON.stringify({ rules }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.availability })
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useMentorAvailabilityExceptions() {
  return useQuery({
    queryKey: mentorKeys.availabilityExceptions,
    queryFn: () =>
      apiFetch<AvailabilityException[]>('/mentors/me/availability-exceptions'),
  })
}

export function useAddAvailabilityException() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAvailabilityExceptionInput) =>
      apiFetch<AvailabilityException>('/mentors/me/availability-exceptions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: mentorKeys.availabilityExceptions,
      })
      void qc.invalidateQueries({ queryKey: ['discovery'] })
    },
  })
}

export function useRemoveAvailabilityException() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (exceptionId: string) =>
      apiFetch<AvailabilityException[]>(
        `/mentors/me/availability-exceptions/${exceptionId}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: mentorKeys.availabilityExceptions,
      })
      void qc.invalidateQueries({ queryKey: ['discovery'] })
    },
  })
}

export function usePublishMentor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<MentorProfile>('/mentors/me/publish', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useUnpublishMentor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<MentorProfile>('/mentors/me/unpublish', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}
