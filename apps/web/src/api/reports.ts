import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { CreateUserReportInput, UserReportEntry } from '@/api/types'

export const reportKeys = {
  me: ['reports', 'me'] as const,
}

export function useMyReports() {
  return useQuery({
    queryKey: reportKeys.me,
    queryFn: () => apiFetch<UserReportEntry[]>('/reports/me'),
  })
}

export function useSubmitReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserReportInput) =>
      apiFetch<UserReportEntry>('/reports', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportKeys.me })
    },
  })
}
