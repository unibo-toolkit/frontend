'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CalendarPreview from '@/components/calendar/CalendarPreview'
import SubjectList from '@/components/create/SubjectList'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { usePublicCalendar, useClaimCalendar } from '@/hooks/useCalendars'
import { usePreview } from '@/hooks/usePreview'
import { useThemeStore } from '@/stores/themeStore'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { getSubjectColorPair } from '@/lib/colors'
import type { SubjectColorPair } from '@/lib/colors'
import styles from './page.module.css'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}

export default function PublicCalendarPage() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const shouldAutoClaim = searchParams.get('autoclaim') === '1'
  const t = useTranslations('create.created')
  const ct = useTranslations('common')
  const et = useTranslations('errors')
  const createT = useTranslations('create')
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const { isLoggedIn } = useAuthStore()
  const { data: calendar, isLoading, error } = usePublicCalendar(slug)
  const claimCalendar = useClaimCalendar()
  const [copied, setCopied] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const allSubjects = calendar?.courses?.flatMap((c) => c.subjects) || []
  const subjectIds = useMemo(() => allSubjects.map((s) => s.id), [allSubjects])

  const [displayPage, setDisplayPage] = useState(0)
  const [apiPage, setApiPage] = useState(0)
  const apiPageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const claimAttemptedRef = useRef(false)

  const { data: previewData } = usePreview(subjectIds, apiPage)

  const [anchorMonday, setAnchorMonday] = useState<Date | null>(null)

  useEffect(() => {
    if (previewData?.target?.start_datetime && apiPage === 0 && displayPage === 0) {
      setAnchorMonday(getMonday(new Date(previewData.target.start_datetime)))
    }
  }, [previewData?.target?.start_datetime, apiPage, displayPage])

  useEffect(() => {
    if (!shouldAutoClaim || !calendar || !isLoggedIn) return
    if (claimAttemptedRef.current) return
    if (calendar.claimed) {
      claimAttemptedRef.current = true
      setClaimed(true)
      router.replace(`/cal/${slug}`)
      return
    }
    claimAttemptedRef.current = true
    claimCalendar.mutateAsync(calendar.id)
      .then(() => {
        setClaimed(true)
        router.replace(`/cal/${slug}`)
      })
      .catch(() => {
        setClaimed(true)
        router.replace(`/cal/${slug}`)
      })
  }, [shouldAutoClaim, calendar, isLoggedIn, claimCalendar, router, slug])

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
      return d >= weekStart && d < weekEnd
    })
  }, [previewData?.items, currentDate, subjectIds.length])

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

  const status = (error as { response?: { status?: number } })?.response?.status

  const allSubjectIds = useMemo(() => new Set(subjectIds), [subjectIds])

  const subjectColors = useMemo(() => {
    const map = new Map<string, SubjectColorPair>()
    allSubjects.forEach((s, idx) => {
      map.set(s.id, getSubjectColorPair(idx, isDark))
    })
    return map
  }, [allSubjects, isDark])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Nav />
        <div className={styles.container}><Skeleton height="600px" /></div>
        <Footer />
      </div>
    )
  }

  if (status === 410) {
    return (
      <div className={styles.errorPage}>
        <h1>{et('expired')}</h1>
        <p>{et('expiredDesc')}</p>
        <a href="/" className={styles.errorLink}>{et('goHome')}</a>
      </div>
    )
  }

  if (!calendar) {
    return (
      <div className={styles.errorPage}>
        <h1>{et('calendarNotFound')}</h1>
        <p>{et('calendarNotFoundDesc')}</p>
        <a href="/" className={styles.errorLink}>{et('goHome')}</a>
      </div>
    )
  }

  const icsUrl = `https://uniplanner.it/cal/${slug}.ics`
  const webcalUrl = icsUrl.replace('https://', 'webcal://')
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(icsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = icsUrl
    a.download = `${calendar.name}.ics`
    a.click()
  }

  return (
    <div className={styles.page}>
      <Nav />
      <div className={styles.container}>
        <div className={styles.form}>
          <h1 className={styles.title}>{calendar.name}</h1>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('addTo')}</span>
            <div className={styles.buttonGrid}>
              <a href={webcalUrl}>
                <Button variant="ghost" fullWidth>
                  <img src="/icons/apple-dark.svg" width={18} height={18} alt="" className={styles.iconDark} />
                  <img src="/icons/apple-light.svg" width={18} height={18} alt="" className={styles.iconLight} />
                  {t('appleCalendar')}
                </Button>
              </a>
              <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" fullWidth>
                  <img src="/icons/google-dark.svg" width={18} height={18} alt="" className={styles.iconDark} />
                  <img src="/icons/google-light.svg" width={18} height={18} alt="" className={styles.iconLight} />
                  {t('googleCalendar')}
                </Button>
              </a>
              <Button variant="ghost" fullWidth onClick={handleCopy}>
                <img src="/icons/link-copy-dark.svg" width={17} height={17} alt="" className={styles.iconDark} />
                <img src="/icons/link-copy-light.svg" width={17} height={17} alt="" className={styles.iconLight} />
                {copied ? ct('copied') : t('copyLink')}
              </Button>
              <Button variant="ghost" fullWidth onClick={handleDownload}>
                <img src="/icons/cloud-download-dark.svg" width={19} height={19} alt="" className={styles.iconDark} />
                <img src="/icons/cloud-download-light.svg" width={19} height={19} alt="" className={styles.iconLight} />
                {t('downloadIcs')}
              </Button>
            </div>
          </div>

          {allSubjects.length > 0 && (
            <SubjectList
              subjects={allSubjects}
              selected={allSubjectIds}
              subjectColors={subjectColors}
              readOnly
            />
          )}

          <div className={styles.promoCard}>
            <p className={styles.promoTitle}>{t('promoText')}</p>
            <Link href="/create">
              <Button variant="primary" fullWidth>{t('createOwn')}</Button>
            </Link>
          </div>
        </div>

        <div className={styles.preview}>
          <div className={styles.calendarWrapper}>
            <span className={styles.previewLabel}>{t('previewLabel')}</span>
            <CalendarPreview
              events={weekEvents}
              subjectColors={subjectColors}
              currentDate={currentDate}
              onWeekChange={handleWeekChange}
              onToday={handleToday}
              isOnToday={isOnToday}
              locale={locale}
              allDayLabel={createT('allDay')}
              todayLabel={createT('today')}
              calViewLabels={[createT('calViewDay'), createT('calViewWeek'), createT('calViewMonth'), createT('calViewYear')]}
            />
          </div>
          {isLoggedIn && !claimed && !calendar.claimed && (
            <div className={styles.claimCard}>
              <p className={styles.claimText}>{t('claimText')}</p>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!calendar) return
                  try {
                    await claimCalendar.mutateAsync(calendar.id)
                    setClaimed(true)
                  } catch {}
                }}
                disabled={claimCalendar.isPending}
              >
                {claimCalendar.isPending ? '...' : t('claimCalendar')}
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
