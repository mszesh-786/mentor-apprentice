import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/api/client'
import type { ApprenticeProfile, ApprenticeProfileInput } from '@/api/types'

export const apprenticeKeys = {
  me: ['apprentices', 'me'] as const,
}

export async function fetchApprenticeProfile(): Promise<ApprenticeProfile | null> {
  try {
    return await apiFetch<ApprenticeProfile>('/apprentices/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function useApprenticeProfile() {
  return useQuery({
    queryKey: apprenticeKeys.me,
    queryFn: fetchApprenticeProfile,
  })
}

export function useCreateApprenticeProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ApprenticeProfileInput) =>
      apiFetch<ApprenticeProfile>('/apprentices/profile', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: apprenticeKeys.me })
    },
  })
}

export function useUpdateApprenticeProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ApprenticeProfileInput) =>
      apiFetch<ApprenticeProfile>('/apprentices/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: apprenticeKeys.me })
    },
  })
}
