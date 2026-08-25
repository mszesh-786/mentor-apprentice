import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/api/client'
import type {
  ProductFeedbackCategory,
  SessionFeedback,
  SubmitApprenticeSessionFeedbackInput,
  SubmitMentorSessionFeedbackInput,
  SubmitProductFeedbackInput,
} from '@/api/types'
import { sessionKeys } from '@/api/sessions'

export const feedbackKeys = {
  sessionMine: (sessionId: string) => ['feedback', 'session', sessionId] as const,
}

export function useMySessionFeedback(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: feedbackKeys.sessionMine(sessionId),
    queryFn: async () => {
      try {
        return await apiFetch<SessionFeedback>(
          `/sessions/${sessionId}/feedback/me`,
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
    enabled: Boolean(sessionId) && enabled,
  })
}

export function useSubmitSessionFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      body,
    }: {
      sessionId: string
      body:
        | SubmitApprenticeSessionFeedbackInput
        | SubmitMentorSessionFeedbackInput
    }) =>
      apiFetch<SessionFeedback>(`/sessions/${sessionId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (feedback) => {
      void qc.setQueryData(
        feedbackKeys.sessionMine(feedback.sessionId),
        feedback,
      )
      void qc.invalidateQueries({ queryKey: sessionKeys.detail(feedback.sessionId) })
      void qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useSubmitProductFeedback() {
  return useMutation({
    mutationFn: (body: SubmitProductFeedbackInput) =>
      apiFetch<{ id: string; category: ProductFeedbackCategory; message: string }>(
        '/feedback/product',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
  })
}
