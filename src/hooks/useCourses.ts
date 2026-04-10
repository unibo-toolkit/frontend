'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Course } from '@/types/calendar'
import type { PaginatedResponse } from '@/types/api'
import type { Subject } from '@/types/calendar'

export function useSearchCourses(query: string, lang: string, enabled = false) {
  return useQuery({
    queryKey: ['courses', query, lang],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Course>>('/api/v1/courses', {
        params: { q: query || undefined, lang, limit: 50 },
      })
      return data
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubjects(courseId: string, curriculumId: string) {
  return useQuery({
    queryKey: ['subjects', courseId, curriculumId],
    queryFn: async () => {
      const { data } = await api.get<{ items: Subject[] }>(
        `/api/v1/courses/${courseId}/subjects`,
        { params: { curriculum_id: curriculumId } }
      )
      return data.items
    },
    enabled: !!courseId && !!curriculumId,
    staleTime: 5 * 60 * 1000,
  })
}
