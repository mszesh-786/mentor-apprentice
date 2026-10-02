import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { IdentityVerification, VerificationStatus } from '@/api/types'
import { mentorKeys } from '@/api/mentors'

export const verificationKeys = {
  me: ['verifications', 'me'] as const,
}

export function useIdentityVerification() {
  return useQuery({
    queryKey: verificationKeys.me,
    queryFn: () => apiFetch<IdentityVerification>('/verifications/me'),
  })
}

export function useStartIdentityVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<IdentityVerification>('/verifications/identity', {
        method: 'POST',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: verificationKeys.me })
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}

export function useStubVerificationResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: VerificationStatus) =>
      apiFetch<IdentityVerification>('/verifications/identity/stub-result', {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: verificationKeys.me })
      void qc.invalidateQueries({ queryKey: mentorKeys.me })
    },
  })
}
