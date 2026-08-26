import { apiFetch } from '@/api/client'
import type { AppRole } from '@/auth/session'

export type UserMe = {
  id: string
  email: string
  emailVerified: boolean
  displayName: string | null
  status: string
  roles: AppRole[]
  needsRoleSelection: boolean
}

export async function fetchCurrentUser(): Promise<UserMe> {
  return apiFetch<UserMe>('/users/me')
}

export async function setUserRoles(roles: AppRole[]): Promise<UserMe> {
  return apiFetch<UserMe>('/users/me/roles', {
    method: 'POST',
    body: JSON.stringify({ roles }),
  })
}
