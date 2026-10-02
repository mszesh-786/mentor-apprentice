import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/api/client'
import { loadSession } from '@/auth/session'

export type HealthCheck = {
  ok: boolean
  path: string
}

/** Authenticated ping — hits a JWT-guarded endpoint. */
export function useAuthPing(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'ping'],
    enabled,
    queryFn: async (): Promise<HealthCheck> => {
      const session = loadSession()
      const path =
        session?.activeRole === 'MENTOR' ? '/mentors/me' : '/apprentices/me'
      try {
        await apiFetch<unknown>(path)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return { ok: true, path }
        }
        throw error
      }
      return { ok: true, path }
    },
    retry: false,
  })
}
