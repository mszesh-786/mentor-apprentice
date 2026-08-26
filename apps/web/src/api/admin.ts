import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type {
  AdminReportDetail,
  AdminReportListItem,
  AdminUserDetail,
  AdminUserListItem,
  ResolveReportInput,
  UserReportStatus,
  UserStatus,
} from '@/api/types'

const keys = {
  users: (q?: string, status?: UserStatus) =>
    ['admin', 'users', q ?? '', status ?? ''] as const,
  user: (id: string) => ['admin', 'users', id] as const,
  reports: (status?: UserReportStatus) =>
    ['admin', 'reports', status ?? ''] as const,
  report: (id: string) => ['admin', 'reports', id] as const,
}

export function useAdminUsers(input?: { q?: string; status?: UserStatus }) {
  const params = new URLSearchParams()
  if (input?.q?.trim()) params.set('q', input.q.trim())
  if (input?.status) params.set('status', input.status)
  const qs = params.toString()
  return useQuery({
    queryKey: keys.users(input?.q, input?.status),
    queryFn: () =>
      apiFetch<AdminUserListItem[]>(`/admin/users${qs ? `?${qs}` : ''}`),
  })
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: keys.user(userId),
    queryFn: () => apiFetch<AdminUserDetail>(`/admin/users/${userId}`),
    enabled: Boolean(userId),
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<AdminUserListItem>(`/admin/users/${userId}/suspend`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      void qc.setQueryData(keys.user(data.id), (prev: AdminUserDetail | undefined) =>
        prev ? { ...prev, ...data } : prev,
      )
    },
  })
}

export function useUnsuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<AdminUserListItem>(`/admin/users/${userId}/unsuspend`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      void qc.setQueryData(keys.user(data.id), (prev: AdminUserDetail | undefined) =>
        prev ? { ...prev, ...data } : prev,
      )
    },
  })
}

export function useAdminReports(status?: UserReportStatus) {
  const qs = status ? `?status=${status}` : ''
  return useQuery({
    queryKey: keys.reports(status),
    queryFn: () => apiFetch<AdminReportListItem[]>(`/admin/reports${qs}`),
  })
}

export function useAdminReport(reportId: string) {
  return useQuery({
    queryKey: keys.report(reportId),
    queryFn: () => apiFetch<AdminReportDetail>(`/admin/reports/${reportId}`),
    enabled: Boolean(reportId),
  })
}

export function useResolveReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { reportId: string; body: ResolveReportInput }) =>
      apiFetch<AdminReportDetail>(`/admin/reports/${input.reportId}/resolve`, {
        method: 'POST',
        body: JSON.stringify(input.body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'reports'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
