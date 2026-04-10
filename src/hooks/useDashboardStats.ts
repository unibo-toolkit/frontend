'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface NextEvent {
  title: string
  start_datetime: string
  end_datetime: string
}

interface PeriodStats {
  events_count: number
  total_hours: number
}

export interface DashboardStats {
  calendars_count: number
  this_week: PeriodStats
  this_month: PeriodStats
  next_event: NextEvent | null
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/api/v1/calendars/me/stats')
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}
