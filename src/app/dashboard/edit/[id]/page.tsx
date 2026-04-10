'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { useLocaleStore } from '@/stores/localeStore'
import { useThemeStore } from '@/stores/themeStore'
import SubjectList from '@/components/create/SubjectList'
import CalendarPreview from '@/components/calendar/CalendarPreview'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { useCalendar, useUpdateCalendar, useDeleteCalendar } from '@/hooks/useCalendars'
import { useSubjects } from '@/hooks/useCourses'
import { usePreview } from '@/hooks/usePreview'
import { getSubjectColorPair } from '@/lib/colors'
import type { SubjectColorPair } from '@/lib/colors'
import dashboardStyles from '../../page.module.css'
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

export default function EditCalendarPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const t = useTranslations('create')
  const dt = useTranslations('dashboard')
  const et = useTranslations('errors')
  const a11y = useTranslations('a11y')
  const { user } = useAuthStore()
  const { locale } = useLocaleStore()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'
  const { data: calendar, isLoading, error } = useCalendar(id)
  const status = (error as { response?: { status?: number } })?.response?.status
  const updateCalendar = useUpdateCalendar()
  const deleteCalendar = useDeleteCalendar()

  const [calendarName, setCalendarName] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [displayPage, setDisplayPage] = useState(0)
  const [apiPage, setApiPage] = useState(0)
  const apiPageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [anchorMonday, setAnchorMonday] = useState<Date | null>(null)

  const courseData = calendar?.courses?.[0]
  const courseId = courseData?.curriculum?.course?.id || ''
  const curriculumId = courseData?.curriculum?.id || ''
  const { data: subjects } = useSubjects(courseId, curriculumId)

  const courseName = courseData?.curriculum?.course
    ? `${courseData.curriculum.course.title_en || courseData.curriculum.course.title_it}`
    : ''
  const curriculumLabel = courseData?.curriculum?.label || ''

  useEffect(() => {
    if (calendar) {
      setCalendarName(calendar.name)
    }
  }, [calendar])

  useEffect(() => {
    if (courseData) {
      setSelectedSubjects(new Set(courseData.subjects.map((s) => s.id)))
    }
  }, [courseData])

  const subjectIds = useMemo(() => Array.from(selectedSubjects), [selectedSubjects])
  const { data: previewData } = usePreview(subjectIds, apiPage)

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

  const subjectColors = useMemo(() => {
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

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  const handleSave = async () => {
    if (!calendar || !curriculumId) return
    await updateCalendar.mutateAsync({
      id: calendar.id,
      name: calendarName,
      lang: locale,
      courses: [{ curriculum_id: curriculumId, subject_ids: Array.from(selectedSubjects) }],
    })
    goBack()
  }

  const handleDelete = async () => {
    if (!calendar) return
    await deleteCalendar.mutateAsync(calendar.id)
    goBack()
  }

  const icsUrl = calendar ? `https://uniplanner.it/cal/${calendar.slug}.ics` : ''
  const webcalUrl = icsUrl.replace('https://', 'webcal://')
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`
  const totalEvents = subjectIds.length > 0 ? (previewData?.courses_events_count || 0) : 0
  const lastSync = calendar?.created_at ? new Date(calendar.created_at).toLocaleString() : ''
  const expires = calendar?.ttl_expires_at ? new Date(calendar.ttl_expires_at).toLocaleDateString() : ''

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={dashboardStyles.sidebar}>
          <div className={dashboardStyles.sidebarTop}>
            <div className={dashboardStyles.sidebarLogo}>
              <Link href="/" className={dashboardStyles.logoLink}>
                <Image src="/logo.png" alt="UniPlanner" width={32} height={32} className={dashboardStyles.logoImg} />
                <span className={dashboardStyles.logoText}>UniPlanner</span>
              </Link>
            </div>
          </div>
        </div>
        <main className={styles.main}>
          <Skeleton height="400px" />
        </main>
      </div>
    )
  }

  if (status === 403) {
    return (
      <div className={styles.errorPage}>
        <h1>{et('accessDenied')}</h1>
        <p>{et('accessDeniedDesc')}</p>
        <button type="button" className={styles.errorButton} onClick={goBack}>
          {et('backToDashboard')}
        </button>
      </div>
    )
  }

  if (status === 404) {
    return (
      <div className={styles.errorPage}>
        <h1>{et('calendarNotFound')}</h1>
        <p>{et('calendarNotFoundDesc')}</p>
        <button type="button" className={styles.errorButton} onClick={goBack}>
          {et('backToDashboard')}
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorPage}>
        <h1>{et('serverError')}</h1>
        <p>{et('serverErrorDesc')}</p>
        <button type="button" className={styles.errorButton} onClick={goBack}>
          {et('backToDashboard')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={`${dashboardStyles.sidebar} ${sidebarOpen ? dashboardStyles.sidebarOpen : ''}`}>
        <div className={dashboardStyles.sidebarTop}>
          <div className={dashboardStyles.sidebarLogo}>
            <Link href="/" className={dashboardStyles.logoLink}>
              <Image src="/logo.png" alt="UniPlanner" width={32} height={32} className={dashboardStyles.logoImg} />
              <span className={dashboardStyles.logoText}>UniPlanner</span>
            </Link>
          </div>
          <div className={dashboardStyles.profile}>
            <div className={dashboardStyles.avatar}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className={dashboardStyles.avatarImg} />
              ) : (
                <div className={dashboardStyles.avatarPlaceholder}>
                  {user?.display_name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className={dashboardStyles.profileInfo}>
              <span className={dashboardStyles.profileName}>{user?.display_name}</span>
              <span className={dashboardStyles.profileEmail}>{user?.email}</span>
            </div>
          </div>
          <nav className={dashboardStyles.sidebarNav}>
            <Link href="/dashboard" className={dashboardStyles.navItem}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7L10 2L17 7V16C17 16.5304 16.7893 17.0391 16.4142 17.4142C16.0391 17.7893 15.5304 18 15 18H5C4.46957 18 3.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {dt('dashboardLink')}
            </Link>
            <Link href="/dashboard/calendars" className={`${dashboardStyles.navItem} ${dashboardStyles.navActive}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {dt('myCalendar')}
            </Link>
            <Link href="/dashboard/settings" className={dashboardStyles.navItem}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 1.5V3.5M10 16.5V18.5M18.5 10H16.5M3.5 10H1.5M16.01 3.99L14.6 5.4M5.4 14.6L3.99 16.01M16.01 16.01L14.6 14.6M5.4 5.4L3.99 3.99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {dt('settings')}
            </Link>
          </nav>
        </div>
        <div className={dashboardStyles.sidebarBottom}>
          <Link href="/create">
            <Button variant="primary" fullWidth>+ {dt('createNew')}</Button>
          </Link>
        </div>
      </div>

      {sidebarOpen && (
        <div className={dashboardStyles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      <main className={styles.main}>
        <div className={styles.mobileTopBar}>
          <button className={dashboardStyles.burger} onClick={() => setSidebarOpen(true)} aria-label={a11y('menu')}>
            <span /><span /><span />
          </button>
        </div>
        <div className={styles.breadcrumb}>
          <div className={styles.breadcrumbRow}>
            <Link href="/dashboard">{dt('dashboardLink')}</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
          </div>
          <div className={styles.breadcrumbRow}>
            <Link href="/dashboard/calendars">{dt('myCalendar')}</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
          </div>
          <div className={styles.breadcrumbRow}>
            <span className={styles.breadcrumbCurrent}>{dt('editBreadcrumb', { name: calendar?.name || '' })}</span>
          </div>
        </div>

        <button type="button" onClick={goBack} className={styles.backLink}>
          <svg width="28" height="28" viewBox="0 0 512 512" fill="none">
            <path d="M244 400L100 256l144-144M120 256h292" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {dt('editCalendarTitle')}
        </button>
        <p className={styles.subtitle}>{courseName} &middot; {cleanCurriculumLabel(curriculumLabel)}</p>

        <div className={styles.content}>
          <div className={styles.formCol}>
            <div className={styles.card}>
              <label className={styles.fieldLabel}>{dt('calendarNameLabel')}</label>
              <input
                type="text"
                className={styles.input}
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className={styles.card}>
              <div className={styles.subjectsHeader}>
                <span className={styles.subjectsTitle}>{dt('subjectsTitle')}</span>
                <span className={styles.subjectsCount}>
                  {dt('subjectsSelected', { selected: selectedSubjects.size, total: subjects?.length || 0 })}
                </span>
              </div>
              {subjects && (
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
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={deleteCalendar.isPending}
              >
                {deleteCalendar.isPending ? '...' : dt('deleteCalendarBtn')}
              </button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={updateCalendar.isPending}
                fullWidth
              >
                {updateCalendar.isPending ? '...' : dt('saveBtn')}
              </Button>
            </div>
          </div>

          <div className={styles.previewCol}>
            <span className={styles.previewLabel}>{dt('previewLabel')}</span>
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

            <div className={styles.card}>
              <span className={styles.icsSectionLabel}>{dt('icsLinkLabel')}</span>
              <div className={styles.icsUrl}>{icsUrl}</div>

              <div className={styles.divider} />

              <a href={webcalUrl} className={styles.calButton}>
                <img src="/icons/apple-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
                <img src="/icons/apple-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
                {dt('addToApple')}
              </a>
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={styles.calButton}>
                <img src="/icons/google-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
                <img src="/icons/google-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
                {dt('addToGoogle')}
              </a>

              <div className={styles.divider} />

              <div className={styles.stats}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>{dt('eventsLabel')}</span>
                  <span className={styles.statValue}>{totalEvents}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>{dt('lastSyncLabel')}</span>
                  <span className={styles.statValue}>{lastSync}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>{dt('expiresLabel')}</span>
                  <span className={styles.statValue}>{expires}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
