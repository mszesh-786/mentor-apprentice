import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { BlockEntry } from '@/api/types'

export const blockKeys = {
  me: ['blocks', 'me'] as const,
}

export function useMyBlocks() {
  return useQuery({
    queryKey: blockKeys.me,
    queryFn: () => apiFetch<BlockEntry[]>('/blocks/me'),
  })
}

export function useBlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (blockedUserId: string) =>
      apiFetch<{ blockedUserId: string }>('/blocks', {
        method: 'POST',
        body: JSON.stringify({ blockedUserId }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: blockKeys.me })
      void qc.invalidateQueries({ queryKey: ['mentorships'] })
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['discovery'] })
    },
  })
}

export function useUnblockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (blockedUserId: string) =>
      apiFetch<void>(`/blocks/${blockedUserId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: blockKeys.me })
      void qc.invalidateQueries({ queryKey: ['discovery'] })
    },
  })
}
