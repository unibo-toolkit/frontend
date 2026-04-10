'use client'

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useEffect } from 'react'
import api from '@/lib/api'
import type { PreviewResponse } from '@/types/api'

async function fetchPreview(subjectIds: string[], page: number): Promise<PreviewResponse> {
  const params = new URLSearchParams()
  subjectIds.forEach((id) => params.append('subject_ids', id))
  params.append('page', String(page))
  const { data } = await api.get<PreviewResponse>(`/api/v1/preview?${params.toString()}`)
  return data
}

export function usePreview(subjectIds: string[], page = 0) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (subjectIds.length === 0) return
    for (const p of [page - 1, page + 1]) {
      queryClient.prefetchQuery({
        queryKey: ['preview', subjectIds, p],
        queryFn: () => fetchPreview(subjectIds, p),
        staleTime: 2 * 60 * 1000,
      })
    }
  }, [page, subjectIds, queryClient])

  return useQuery({
    queryKey: ['preview', subjectIds, page],
    queryFn: () => fetchPreview(subjectIds, page),
    enabled: subjectIds.length > 0,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
