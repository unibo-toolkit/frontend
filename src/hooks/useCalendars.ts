'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Calendar, CalendarListItem, CreateCalendarRequest, PublicCalendar } from '@/types/calendar'

export function useCalendars() {
  return useQuery({
    queryKey: ['calendars'],
    queryFn: async () => {
      const { data } = await api.get<{ items: CalendarListItem[] }>('/api/v1/calendars')
      return data.items
    },
  })
}

export function useCalendar(id: string) {
  return useQuery({
    queryKey: ['calendar', id],
    queryFn: async () => {
      const { data } = await api.get<Calendar>(`/api/v1/calendars/${id}`)
      return data
    },
    enabled: !!id,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 404 || status === 410) return false
      return failureCount < 3
    },
  })
}

export function usePublicCalendar(slug: string) {
  return useQuery({
    queryKey: ['public-calendar', slug],
    queryFn: async () => {
      const { data } = await api.get<PublicCalendar>(`/api/v1/calendars/public/${slug}`)
      return data
    },
    enabled: !!slug,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 410) return false
      return failureCount < 3
    },
  })
}

export function useCreateCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateCalendarRequest) => {
      const { data: result } = await api.post<Calendar>('/api/v1/calendars', data)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
    },
  })
}

export function useUpdateCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: CreateCalendarRequest & { id: string }) => {
      const { data: result } = await api.patch<Calendar>(`/api/v1/calendars/${id}`, data)
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
      queryClient.invalidateQueries({ queryKey: ['calendar', variables.id] })
    },
  })
}

export function useDeleteCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/calendars/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
    },
  })
}

export function useClaimCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Calendar>(`/api/v1/calendars/${id}/claim`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
    },
  })
}
