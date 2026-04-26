'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Course } from '@/types/calendar'
import type { PaginatedResponse } from '@/types/api'
import type { Subject } from '@/types/calendar'

export function useSearchCourses(query: string, lang: string, enabled = false, courseType?: string) {
  return useQuery({
    queryKey: ['courses', query, lang, courseType],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Course>>('/api/v1/courses', {
        params: { q: query || undefined, lang, limit: 50, type: courseType || undefined },
      })
      return data
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubjects(courseId: string, curriculumId: string, formatTitles = false) {
  return useQuery({
    queryKey: ['subjects', courseId, curriculumId, formatTitles],
    queryFn: async () => {
      const { data } = await api.get<{ items: Subject[] }>(
        `/api/v1/courses/${courseId}/subjects`,
        { params: { curriculum_id: curriculumId, format_titles: formatTitles || undefined } }
      )
      return data.items
    },
    enabled: !!courseId && !!curriculumId,
    staleTime: 5 * 60 * 1000,
  })
}
