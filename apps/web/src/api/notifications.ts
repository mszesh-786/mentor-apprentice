import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { AppNotification } from '@/api/types'

export const notificationKeys = {
  me: ['notifications', 'me'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: [...notificationKeys.me, unreadOnly ? 'unread' : 'all'],
    queryFn: () =>
      apiFetch<AppNotification[]>(
        `/notifications/me${unreadOnly ? '?unreadOnly=true' : ''}`,
      ),
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => apiFetch<{ count: number }>('/notifications/me/unread-count'),
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch<AppNotification>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.me })
      void qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<{ updated: number }>('/notifications/me/read-all', {
        method: 'POST',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.me })
      void qc.invalidateQueries({ queryKey: notificationKeys.unreadCount })
    },
  })
}
