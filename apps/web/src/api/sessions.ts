import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/api/client'
import type { MentoringSession, UpsertSessionSummaryInput } from '@/api/types'

export const sessionKeys = {
  me: (upcoming?: boolean) => ['sessions', 'me', upcoming] as const,
  detail: (id: string) => ['sessions', id] as const,
  byBooking: (bookingId: string) =>
    ['sessions', 'by-booking', bookingId] as const,
}

export function useMySessions(upcoming?: boolean) {
  return useQuery({
    queryKey: sessionKeys.me(upcoming),
    queryFn: () => {
      const qs =
        upcoming === undefined
          ? ''
          : `?upcoming=${upcoming ? 'true' : 'false'}`
      return apiFetch<MentoringSession[]>(`/sessions/me${qs}`)
    },
  })
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => apiFetch<MentoringSession>(`/sessions/${sessionId}`),
    enabled: Boolean(sessionId),
  })
}

export async function fetchSessionForBooking(
  bookingId: string,
): Promise<MentoringSession | null> {
  try {
    return await apiFetch<MentoringSession>(`/bookings/${bookingId}/session`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function useSessionForBooking(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.byBooking(bookingId),
    queryFn: () => fetchSessionForBooking(bookingId),
    enabled: Boolean(bookingId) && enabled,
  })
}

function invalidateSessions(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['sessions'] })
  void qc.invalidateQueries({ queryKey: ['bookings'] })
}

export function useJoinSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<MentoringSession>(`/sessions/${sessionId}/join`, {
        method: 'POST',
      }),
    onSuccess: (session) => {
      void qc.setQueryData(sessionKeys.detail(session.id), session)
      invalidateSessions(qc)
    },
  })
}

export function useCompleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<MentoringSession>(`/sessions/${sessionId}/complete`, {
        method: 'POST',
      }),
    onSuccess: (session) => {
      void qc.setQueryData(sessionKeys.detail(session.id), session)
      invalidateSessions(qc)
    },
  })
}

export function useReportNoShow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<MentoringSession>(`/sessions/${sessionId}/report-no-show`, {
        method: 'POST',
      }),
    onSuccess: (session) => {
      void qc.setQueryData(sessionKeys.detail(session.id), session)
      invalidateSessions(qc)
    },
  })
}

export function useReportTechnicalFailure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<MentoringSession>(
        `/sessions/${sessionId}/report-technical-failure`,
        { method: 'POST' },
      ),
    onSuccess: (session) => {
      void qc.setQueryData(sessionKeys.detail(session.id), session)
      invalidateSessions(qc)
    },
  })
}

export function useUpsertSessionSummary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      body,
    }: {
      sessionId: string
      body: UpsertSessionSummaryInput
    }) =>
      apiFetch<MentoringSession>(`/sessions/${sessionId}/summary`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: (session) => {
      void qc.setQueryData(sessionKeys.detail(session.id), session)
      invalidateSessions(qc)
    },
  })
}
