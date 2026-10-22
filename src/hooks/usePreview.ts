'use client'

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useEffect } from 'react'
import api from '@/lib/api'
import type { PreviewResponse } from '@/types/api'

async function fetchPreview(subjectIds: string[], page: number, formatTitles: boolean): Promise<PreviewResponse> {
  const { data } = await api.get<PreviewResponse>('/api/v1/timetable/preview', {
    params: {
      subject_ids: subjectIds.join(','),
      page,
      format_titles: formatTitles ? 'true' : 'false',
    },
  })
  return data
}

export function usePreview(subjectIds: string[], page = 0, formatTitles = false) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (subjectIds.length === 0) return
    for (const p of [page - 1, page + 1]) {
      queryClient.prefetchQuery({
        queryKey: ['preview', subjectIds, p, formatTitles],
        queryFn: () => fetchPreview(subjectIds, p, formatTitles),
        staleTime: 2 * 60 * 1000,
      })
    }
  }, [page, subjectIds, formatTitles, queryClient])

  return useQuery({
    queryKey: ['preview', subjectIds, page, formatTitles],
    queryFn: () => fetchPreview(subjectIds, page, formatTitles),
    enabled: subjectIds.length > 0,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
