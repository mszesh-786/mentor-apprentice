import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type {
  ContinueMentorshipInput,
  Mentorship,
  MentorshipBookingSummary,
  MentorshipSessionSummary,
  MentorshipStatus,
  UpsertMentorshipGoalInput,
} from '@/api/types'

export const mentorshipKeys = {
  me: (status?: MentorshipStatus) =>
    ['mentorships', 'me', status] as const,
  detail: (id: string) => ['mentorships', id] as const,
  bookings: (id: string) => ['mentorships', id, 'bookings'] as const,
  sessions: (id: string) => ['mentorships', id, 'sessions'] as const,
}

function invalidateMentorships(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['mentorships'] })
}

export function useMyMentorships(status?: MentorshipStatus) {
  return useQuery({
    queryKey: mentorshipKeys.me(status),
    queryFn: () => {
      const qs = status ? `?status=${status}` : ''
      return apiFetch<Mentorship[]>(`/mentorships/me${qs}`)
    },
  })
}

export function useMentorship(id: string) {
  return useQuery({
    queryKey: mentorshipKeys.detail(id),
    queryFn: () => apiFetch<Mentorship>(`/mentorships/${id}`),
    enabled: Boolean(id),
  })
}

export function useMentorshipBookings(id: string) {
  return useQuery({
    queryKey: mentorshipKeys.bookings(id),
    queryFn: () =>
      apiFetch<MentorshipBookingSummary[]>(`/mentorships/${id}/bookings`),
    enabled: Boolean(id),
  })
}

export function useMentorshipSessions(id: string) {
  return useQuery({
    queryKey: mentorshipKeys.sessions(id),
    queryFn: () =>
      apiFetch<MentorshipSessionSummary[]>(`/mentorships/${id}/sessions`),
    enabled: Boolean(id),
  })
}

export function useContinueFromSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      body,
    }: {
      sessionId: string
      body?: ContinueMentorshipInput
    }) =>
      apiFetch<Mentorship>(`/sessions/${sessionId}/continue`, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      }),
    onSuccess: () => {
      invalidateMentorships(qc)
    },
  })
}

export function usePauseMentorship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Mentorship>(`/mentorships/${id}/pause`, { method: 'POST' }),
    onSuccess: (data) => {
      void qc.setQueryData(mentorshipKeys.detail(data.id), data)
      invalidateMentorships(qc)
    },
  })
}

export function useResumeMentorship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Mentorship>(`/mentorships/${id}/resume`, { method: 'POST' }),
    onSuccess: (data) => {
      void qc.setQueryData(mentorshipKeys.detail(data.id), data)
      invalidateMentorships(qc)
    },
  })
}

export function useCompleteMentorship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Mentorship>(`/mentorships/${id}/complete`, { method: 'POST' }),
    onSuccess: (data) => {
      void qc.setQueryData(mentorshipKeys.detail(data.id), data)
      invalidateMentorships(qc)
    },
  })
}

export function useEndMentorship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Mentorship>(`/mentorships/${id}/end`, { method: 'POST' }),
    onSuccess: (data) => {
      void qc.setQueryData(mentorshipKeys.detail(data.id), data)
      invalidateMentorships(qc)
    },
  })
}

export function useUpsertMentorshipGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: UpsertMentorshipGoalInput
    }) =>
      apiFetch<Mentorship>(`/mentorships/${id}/goals`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.setQueryData(mentorshipKeys.detail(data.id), data)
      invalidateMentorships(qc)
    },
  })
}

export function useAchieveMentorshipGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, goalId }: { id: string; goalId: string }) =>
      apiFetch<Mentorship>(`/mentorships/${id}/goals/${goalId}/achieve`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      void qc.setQueryData(mentorshipKeys.detail(data.id), data)
      invalidateMentorships(qc)
    },
  })
}

export function useCancelMentorshipGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, goalId }: { id: string; goalId: string }) =>
      apiFetch<Mentorship>(`/mentorships/${id}/goals/${goalId}/cancel`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      void qc.setQueryData(mentorshipKeys.detail(data.id), data)
      invalidateMentorships(qc)
    },
  })
}
