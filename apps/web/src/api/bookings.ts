import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { Booking, CreateBookingInput } from '@/api/types'

export const bookingKeys = {
  me: (upcoming?: boolean) => ['bookings', 'me', upcoming] as const,
  detail: (id: string) => ['bookings', id] as const,
}

export function useMyBookings(upcoming?: boolean) {
  return useQuery({
    queryKey: bookingKeys.me(upcoming),
    queryFn: () => {
      const qs =
        upcoming === undefined
          ? ''
          : `?upcoming=${upcoming ? 'true' : 'false'}`
      return apiFetch<Booking[]>(`/bookings/me${qs}`)
    },
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateBookingInput) =>
      apiFetch<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiFetch<Booking>(`/bookings/${bookingId}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useAcceptBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiFetch<Booking>(`/bookings/${bookingId}/accept`, { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useDeclineBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiFetch<Booking>(`/bookings/${bookingId}/decline`, { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
