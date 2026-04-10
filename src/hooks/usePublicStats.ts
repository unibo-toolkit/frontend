'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface PublicStats {
  active_calendars_count: number
  total_events_count: number
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const { data } = await api.get<PublicStats>('/api/v1/calendars/public/stats')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
