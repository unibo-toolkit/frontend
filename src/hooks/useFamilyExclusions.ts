'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ExcludedFamily, TimetableEvent } from '@/types/api'

export type FamilySummary = Pick<
  ExcludedFamily,
  'family_hash' | 'subject_id' | 'title' | 'group_id' | 'weekday' | 'slot_start'
> &
  Partial<Pick<ExcludedFamily, 'events' | 'first_at' | 'last_at'>>

function summaryOf(event: TimetableEvent): FamilySummary {
  return {
    family_hash: event.family_hash,
    subject_id: event.subject_id,
    title: event.title,
    group_id: event.group_id,
    weekday: event.weekday,
    slot_start: event.slot_start,
  }
}

const NO_FAMILIES: ExcludedFamily[] = []

// keepUnknown: send hashes whose subject is unknown on save (exclusions already stored on an existing calendar)
export function useFamilyExclusions(selectedSubjects: Set<string>, keepUnknown = false) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [fromEvents, setFromEvents] = useState<Map<string, FamilySummary>>(new Map())
  const [previewFamilies, setPreviewFamilies] = useState<ExcludedFamily[]>(NO_FAMILIES)

  const toggleEvent = useCallback((event: TimetableEvent) => {
    setFromEvents((prev) =>
      prev.has(event.family_hash) ? prev : new Map(prev).set(event.family_hash, summaryOf(event)),
    )
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(event.family_hash)) next.delete(event.family_hash)
      else next.add(event.family_hash)
      return next
    })
  }, [])

  const restore = useCallback((hash: string) => {
    setExcluded((prev) => {
      if (!prev.has(hash)) return prev
      const next = new Set(prev)
      next.delete(hash)
      return next
    })
  }, [])

  const reset = useCallback((hashes: string[]) => setExcluded(new Set(hashes)), [])

  const trackPreview = useCallback((families: ExcludedFamily[] | undefined) => {
    setPreviewFamilies(families ?? NO_FAMILIES)
  }, [])

  const hashes = useMemo(() => [...excluded].sort(), [excluded])

  const known = useMemo(() => {
    const map = new Map<string, FamilySummary>(fromEvents)
    for (const family of previewFamilies) map.set(family.family_hash, family)
    return map
  }, [fromEvents, previewFamilies])

  const families = useMemo(
    () =>
      hashes
        .map((hash) => known.get(hash))
        .filter((family): family is FamilySummary => !!family && selectedSubjects.has(family.subject_id))
        .sort((a, b) => a.weekday - b.weekday || a.slot_start.localeCompare(b.slot_start)),
    [hashes, known, selectedSubjects],
  )

  const payload = useMemo(
    () =>
      hashes.filter((hash) => {
        const family = known.get(hash)
        return family ? selectedSubjects.has(family.subject_id) : keepUnknown
      }),
    [hashes, known, selectedSubjects, keepUnknown],
  )

  const excludedEventCount = useMemo(
    () =>
      previewFamilies
        .filter((family) => excluded.has(family.family_hash) && selectedSubjects.has(family.subject_id))
        .reduce((sum, family) => sum + family.events, 0),
    [previewFamilies, excluded, selectedSubjects],
  )

  const isExcluded = useCallback((hash: string) => excluded.has(hash), [excluded])

  return {
    hashes,
    families,
    payload,
    excludedEventCount,
    isExcluded,
    toggleEvent,
    restore,
    reset,
    trackPreview,
  }
}
