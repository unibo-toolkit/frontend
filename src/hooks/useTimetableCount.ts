'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { TimetableResponse } from '@/types/api'

export function useTimetableCount(subjectIds: string[], enabled = false) {
  return useQuery({
    queryKey: ['timetable-count', subjectIds],
    queryFn: async () => {
      const params = new URLSearchParams()
      subjectIds.forEach((id) => params.append('subject_ids', id))
      const { data } = await api.get<TimetableResponse>(`/api/v1/timetable?${params.toString()}`)
      return data.total
    },
    enabled: enabled && subjectIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}
