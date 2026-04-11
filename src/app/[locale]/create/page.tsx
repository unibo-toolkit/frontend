'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Nav from '@/components/layout/Nav'
import StepWizard from '@/components/create/StepWizard'
import CourseSearch from '@/components/create/CourseSearch'
import SubjectList from '@/components/create/SubjectList'
import CalendarPreview from '@/components/calendar/CalendarPreview'
import CreatedModal from '@/components/create/CreatedModal'
import Button from '@/components/ui/Button'
import InfoCard from '@/components/ui/InfoCard'
import { useSubjects } from '@/hooks/useCourses'
import { usePreview } from '@/hooks/usePreview'
import { useCreateCalendar } from '@/hooks/useCalendars'
import { useAuthStore } from '@/stores/authStore'
import { useLocale } from 'next-intl'
import { useThemeStore } from '@/stores/themeStore'
import { getSubjectColorPair } from '@/lib/colors'
import type { SubjectColorPair } from '@/lib/colors'
import type { Course, Curriculum, Calendar } from '@/types/calendar'
import styles from './page.module.css'

function cleanCurriculumLabel(label: string): string {
  let clean = label.replace(/^curriculum[:\s]+/i, '').trim()
  if (clean === clean.toUpperCase() && clean.length > 2) {
    clean = clean.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return clean
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}


export default function CreatePage() {
  const t = useTranslations('create')
  const { isLoggedIn } = useAuthStore()
  const locale = useLocale()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [calendarName, setCalendarName] = useState('')
  const [createdCalendar, setCreatedCalendar] = useState<Calendar | null>(null)
  const [showCreatedModal, setShowCreatedModal] = useState(false)

  const [displayPage, setDisplayPage] = useState(0)
  const [apiPage, setApiPage] = useState(0)
  const apiPageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const courseId = selectedCourse?.id || ''
  const curriculumId = selectedCurriculum?.id || ''
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(courseId, curriculumId)

  const subjectIds = useMemo(() => Array.from(selectedSubjects), [selectedSubjects])
  const { data: previewData, isFetching: previewFetching } = usePreview(subjectIds, apiPage)

  const [anchorMonday, setAnchorMonday] = useState<Date | null>(null)

  useEffect(() => {
    if (previewData?.target?.start_datetime && apiPage === 0 && displayPage === 0) {
      setAnchorMonday(getMonday(new Date(previewData.target.start_datetime)))
    }
  }, [previewData?.target?.start_datetime, apiPage, displayPage])

  const currentDate = useMemo(() => {
    const base = anchorMonday ?? getMonday(new Date())
    const d = new Date(base)
    d.setDate(d.getDate() + displayPage * 7)
    return d
  }, [anchorMonday, displayPage])

  const weekEvents = useMemo(() => {
    if (!previewData?.items || subjectIds.length === 0) return []
    const weekStart = new Date(currentDate)
    const weekEnd = new Date(currentDate)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return previewData.items.filter((e) => {
      const d = new Date(e.start_datetime)
      return d >= weekStart && d < weekEnd && selectedSubjects.has(e.subject_id)
    })
  }, [previewData?.items, currentDate, subjectIds.length, selectedSubjects])

  const createCalendar = useCreateCalendar()

  const step = selectedCurriculum ? (selectedSubjects.size > 0 ? 3 : 2) : 1
  const stepLabel = step === 1 ? t('step1of3') : step === 2 ? t('step2of3') : t('step3of3')

  const years = useMemo(() => {
    if (!selectedCourse) return []
    const yearsSet = new Set(selectedCourse.curricula.map((c) => c.academic_year))
    return Array.from(yearsSet).sort()
  }, [selectedCourse])

  const curricula = useMemo(() => {
    if (!selectedCourse || !selectedYear) return []
    return selectedCourse.curricula.filter((c) => c.academic_year === selectedYear)
  }, [selectedCourse, selectedYear])

  useEffect(() => {
    if (curricula.length === 1) {
      setSelectedCurriculum(curricula[0])
      setSelectedSubjects(new Set())
    }
  }, [curricula])

  const subjectColors = useMemo<Map<string, SubjectColorPair>>(() => {
    const map = new Map<string, SubjectColorPair>()
    subjects?.forEach((s, idx) => {
      map.set(s.id, getSubjectColorPair(idx, isDark))
    })
    return map
  }, [subjects, isDark])

  const selectedSubjectColors = useMemo<Map<string, SubjectColorPair>>(() => {
    const map = new Map<string, SubjectColorPair>()
    subjectColors.forEach((color, id) => {
      if (selectedSubjects.has(id)) map.set(id, color)
    })
    return map
  }, [subjectColors, selectedSubjects])

  const [toggling, setToggling] = useState(false)

  const handleToggleSubject = useCallback((id: string) => {
    setToggling(true)
    setSelectedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setDisplayPage(0)
        setApiPage(0)
        setAnchorMonday(null)
      } else {
        next.add(id)
      }
      return next
    })
    setTimeout(() => setToggling(false), 150)
  }, [])

  const handleSelectAll = useCallback(() => {
    if (subjects) setSelectedSubjects(new Set(subjects.map((s) => s.id)))
  }, [subjects])

  const handleDeselectAll = useCallback(() => {
    setSelectedSubjects(new Set())
    setDisplayPage(0)
    setApiPage(0)
    setAnchorMonday(null)
  }, [])

  const handleCreate = async () => {
    if (!selectedCurriculum || selectedSubjects.size === 0) return
    const autoName = selectedCourse?.title ?? ''
    const result = await createCalendar.mutateAsync({
      name: calendarName.trim() || autoName,
      lang: locale,
      courses: [
        {
          curriculum_id: selectedCurriculum.id,
          subject_ids: Array.from(selectedSubjects),
        },
      ],
    })
    setCreatedCalendar(result)
    setShowCreatedModal(true)
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const delta = direction === 'next' ? 1 : -1
    const newDisplay = displayPage + delta
    setDisplayPage(newDisplay)
    if (apiPageTimerRef.current) clearTimeout(apiPageTimerRef.current)
    apiPageTimerRef.current = setTimeout(() => setApiPage(newDisplay), 300)
  }

  const todayPage = useMemo(() => {
    if (!anchorMonday) return 0
    const todayMonday = getMonday(new Date())
    return Math.round((todayMonday.getTime() - anchorMonday.getTime()) / (7 * 24 * 60 * 60 * 1000))
  }, [anchorMonday])

  const isOnToday = displayPage === todayPage

  const handleToday = () => {
    setDisplayPage(todayPage)
    if (apiPageTimerRef.current) clearTimeout(apiPageTimerRef.current)
    apiPageTimerRef.current = setTimeout(() => setApiPage(todayPage), 300)
  }

  const showSubjectSkeleton = !!curriculumId && subjectsLoading
  const noCurricula = !!selectedCourse && years.length === 0

  return (
    <div className={styles.page}>
      <Nav />
      <div className={styles.container}>
        <div className={styles.form}>
          <StepWizard step={step} totalSteps={3} label={stepLabel}>
            <div className={styles.header}>
              <h1 className={styles.title}>{t('selectCourse')}</h1>
              <p className={styles.subtitle}>{t('findDegree')}</p>
            </div>

            <CourseSearch
              onSelect={(course) => {
                setSelectedCourse(course)
                setSelectedYear(null)
                setSelectedCurriculum(null)
                setSelectedSubjects(new Set())
              }}
              selectedCourse={selectedCourse}
            />

            {noCurricula && (
              <p className={styles.noCurricula}>{t('noCurricula')}</p>
            )}

            {selectedCourse && years.length > 0 && (
              <div className={styles.selectRow}>
                <select
                  className={`${styles.select} ${styles.selectYear}`}
                  value={selectedYear ?? ''}
                  onChange={(e) => {
                    const year = Number(e.target.value) || null
                    setSelectedYear(year)
                    setSelectedCurriculum(null)
                    setSelectedSubjects(new Set())
                  }}
                >
                  <option value="">{t('year')}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {selectedYear && curricula.length > 1 && (
                  <select
                    className={styles.select}
                    value={selectedCurriculum?.id ?? ''}
                    onChange={(e) => {
                      const c = curricula.find((c) => c.id === e.target.value) ?? null
                      setSelectedCurriculum(c)
                      setSelectedSubjects(new Set())
                    }}
                  >
                    <option value="">{t('curriculum')}</option>
                    {curricula.map((c) => (
                      <option key={c.id} value={c.id}>{cleanCurriculumLabel(c.label)}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {showSubjectSkeleton && (
              <SubjectList
                subjects={[]}
                selected={selectedSubjects}
                subjectColors={subjectColors}
                onToggle={handleToggleSubject}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                isLoading
              />
            )}

            {subjects && subjects.length > 0 && (
              <SubjectList
                subjects={subjects}
                selected={selectedSubjects}
                subjectColors={subjectColors}
                onToggle={handleToggleSubject}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                disabled={toggling}
              />
            )}
          </StepWizard>
        </div>

        <div className={styles.preview}>
          <div className={styles.calendarWrapper}>
            <p className={styles.previewLabel}>{t('preview')}</p>
            <CalendarPreview
              events={weekEvents}
              subjectColors={selectedSubjectColors}
              currentDate={currentDate}
              onWeekChange={handleWeekChange}
              onToday={handleToday}
              isOnToday={isOnToday}
              locale={locale}
              allDayLabel={t('allDay')}
              todayLabel={t('today')}
              calViewLabels={[t('calViewDay'), t('calViewWeek'), t('calViewMonth'), t('calViewYear')]}
            />
          </div>

          {selectedSubjects.size > 0 && (
            <div className={styles.createSection}>
              <div className={styles.nameRow}>
                <div className={styles.nameInputWrap}>
                  <label className={styles.nameLabel}>{t('calendarName')}</label>
                  <input
                    type="text"
                    className={styles.nameInput}
                    placeholder={t('calendarNamePlaceholder')}
                    value={calendarName}
                    onChange={(e) => setCalendarName(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  disabled={createCalendar.isPending || previewFetching}
                >
                  {t('createButton')}
                </Button>
              </div>
              {!isLoggedIn && (
                <InfoCard variant="warning">{t('ttlWarning')}</InfoCard>
              )}
            </div>
          )}
        </div>
      </div>

      <CreatedModal
        isOpen={showCreatedModal}
        onClose={() => setShowCreatedModal(false)}
        calendar={createdCalendar}
        eventCount={previewData?.courses_events_count}
      />
    </div>
  )
}
