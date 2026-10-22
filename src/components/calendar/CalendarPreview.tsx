'use client'

import { useMemo, useRef, useCallback, useEffect, useState, Fragment } from 'react'
import { useTranslations } from 'next-intl'
import type { TimetableEvent } from '@/types/api'
import type { SubjectColorPair } from '@/lib/colors'
import EventCard from './EventCard'
import styles from './CalendarPreview.module.css'

interface CalendarPreviewProps {
  events: TimetableEvent[]
  subjectColors: Map<string, SubjectColorPair>
  currentDate: Date
  onWeekChange: (direction: 'prev' | 'next') => void
  onToday?: () => void
  isOnToday?: boolean
  locale?: string
  allDayLabel?: string
  todayLabel?: string
  calViewLabels?: [string, string, string, string]
  disableNavigation?: boolean
}

const DESIGN_WIDTH  = 700
const COMPACT_BREAKPOINT    = 560
const COMPACT_DESIGN_WIDTH  = 380
const COMPACT_DAYS          = 3
const DAY_HDR_H             = 22
const ALL_DAY_H             = 22
const TOOLBAR_H             = 52
const MONTH_H               = 49
const HOUR_HEIGHT           = 40
const START_HOUR            = 8
const END_HOUR              = 19
const NUM_HOURS             = END_HOUR - START_HOUR + 1

export const DESIGN_HEIGHT =
  TOOLBAR_H + MONTH_H + DAY_HDR_H + ALL_DAY_H + NUM_HOURS * HOUR_HEIGHT

const SWIPE_THRESHOLD = 50
const AXIS_LOCK_DISTANCE = 8
const EDGE_GUARD = 32

const FALLBACK_COLORS: SubjectColorPair = {
  bg: '#133d3f',
  text: '#3dbcc1',
  border: '#3dbcc1',
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return Array.from({ length: 6 }, (_, i) => {
    const result = new Date(monday)
    result.setDate(monday.getDate() + i)
    return result
  })
}

function getEventStyle(event: TimetableEvent) {
  const start = new Date(event.start_datetime)
  const end = new Date(event.end_datetime)
  const top = (start.getHours() - START_HOUR + start.getMinutes() / 60) * HOUR_HEIGHT
  const height = ((end.getTime() - start.getTime()) / 3600000) * HOUR_HEIGHT
  return { top: `${top}px`, height: `${Math.max(height, 20)}px` }
}

function groupOverlapping(events: TimetableEvent[]): TimetableEvent[][] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  )
  const groups: TimetableEvent[][] = []
  for (const event of sorted) {
    const eventStart = new Date(event.start_datetime).getTime()
    const placed = groups.find((group) => {
      const lastEnd = Math.max(...group.map((e) => new Date(e.end_datetime).getTime()))
      return eventStart < lastEnd
    })
    if (placed) placed.push(event)
    else groups.push([event])
  }
  return groups
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function CalendarPreview({
  events,
  subjectColors,
  currentDate,
  onWeekChange,
  locale = 'en',
  allDayLabel = 'all-day',
  calViewLabels = ['Day', 'Week', 'Month', 'Year'],
  onToday,
  isOnToday = true,
  todayLabel = 'Today',
  disableNavigation = false,
}: CalendarPreviewProps) {
  const a11y = useTranslations('a11y')
  const outerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const compact = containerWidth !== null && containerWidth < COMPACT_BREAKPOINT
  const designWidth = compact ? COMPACT_DESIGN_WIDTH : DESIGN_WIDTH
  const scale = containerWidth !== null ? containerWidth / designWidth : null

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  const weekKey = weekDates[0].toDateString()

  const todayIndex = weekDates.findIndex((d) => d.toDateString() === new Date().toDateString())
  const todayDayPage = todayIndex >= COMPACT_DAYS ? 1 : 0
  const [dayPage, setDayPage] = useState(todayIndex >= 0 ? todayDayPage : 0)
  const pendingDayPage = useRef<number | null>(null)

  useEffect(() => {
    if (pendingDayPage.current !== null) {
      setDayPage(pendingDayPage.current)
      pendingDayPage.current = null
    } else {
      setDayPage(todayIndex >= 0 ? todayDayPage : 0)
    }
  }, [weekKey])

  const goPrev = useCallback(() => {
    if (compact && dayPage > 0) return setDayPage(dayPage - 1)
    if (compact) pendingDayPage.current = 1
    onWeekChange('prev')
  }, [compact, dayPage, onWeekChange])

  const goNext = useCallback(() => {
    if (compact && dayPage < 1) return setDayPage(dayPage + 1)
    if (compact) pendingDayPage.current = 0
    onWeekChange('next')
  }, [compact, dayPage, onWeekChange])

  const showToday = !!onToday && !disableNavigation &&
    (!isOnToday || (compact && todayIndex >= 0 && dayPage !== todayDayPage))

  const goToday = useCallback(() => {
    if (isOnToday) return setDayPage(todayDayPage)
    pendingDayPage.current = (new Date().getDay() || 7) - 1 >= COMPACT_DAYS ? 1 : 0
    onToday?.()
  }, [isOnToday, todayDayPage, onToday])

  const visibleDays = compact
    ? weekDates.map((date, dayIndex) => ({ date, dayIndex })).slice(dayPage * COMPACT_DAYS, (dayPage + 1) * COMPACT_DAYS)
    : weekDates.map((date, dayIndex) => ({ date, dayIndex }))
  const hours = useMemo(
    () => Array.from({ length: NUM_HOURS }, (_, i) => START_HOUR + i),
    []
  )

  const monthYear = useMemo(() => {
    const month = capitalize(currentDate.toLocaleDateString(locale, { month: 'long' }))
    return `${month}, ${currentDate.getFullYear()}`
  }, [currentDate, locale])

  const dayLabels = useMemo(
    () => weekDates.map((d) => capitalize(d.toLocaleDateString(locale, { weekday: 'short' }))),
    [weekDates, locale]
  )

  const eventsByDay = useMemo(() => {
    const map = new Map<number, TimetableEvent[]>()
    for (const event of events) {
      const d = new Date(event.start_datetime)
      const dow = d.getDay()
      const idx = dow === 0 ? 6 : dow - 1
      if (!map.has(idx)) map.set(idx, [])
      map.get(idx)!.push(event)
    }
    return map
  }, [events])

  const swipeHandlers = useRef({ goPrev, goNext })
  swipeHandlers.current = { goPrev, goNext }

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    let start: { x: number; y: number } | null = null
    let axis: 'x' | 'y' | null = null

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      start = { x: touch.clientX, y: touch.clientY }
      axis = null
      if (touch.clientX < EDGE_GUARD || touch.clientX > window.innerWidth - EDGE_GUARD) {
        e.preventDefault()
      }
    }

    const onMove = (e: TouchEvent) => {
      if (!start) return
      const dx = e.touches[0].clientX - start.x
      const dy = e.touches[0].clientY - start.y
      if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) > AXIS_LOCK_DISTANCE) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (axis === 'x' && e.cancelable) e.preventDefault()
    }

    const onEnd = (e: TouchEvent) => {
      if (start && axis === 'x') {
        const dx = e.changedTouches[0].clientX - start.x
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          if (dx > 0) swipeHandlers.current.goPrev()
          else swipeHandlers.current.goNext()
        }
      }
      start = null
      axis = null
    }

    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return (
    <div
      ref={outerRef}
      className={styles.outer}
      style={{ height: scale !== null ? `${DESIGN_HEIGHT * scale}px` : undefined, visibility: scale !== null ? 'visible' : 'hidden' }}
    >
      <div
        className={`${styles.container} ${compact ? styles.compact : ''}`}
        style={{ transform: `scale(${scale ?? 1})`, transformOrigin: 'top left', width: `${designWidth}px` }}
      >
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarLeft}>
            <div className={styles.trafficLights}>
              <div className={`${styles.dot} ${styles.dotRed}`} />
              <div className={`${styles.dot} ${styles.dotYellow}`} />
              <div className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.navBtnGroup}>
              <button className={styles.navBtn} onClick={goPrev} aria-label={a11y('prevWeek')} disabled={disableNavigation}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className={styles.navBtn} onClick={goNext} aria-label={a11y('nextWeek')} disabled={disableNavigation}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 11L9 7L5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showToday && (
                <button className={styles.todayBtn} onClick={goToday}>
                  {todayLabel}
                </button>
              )}
            </div>
          </div>

          <div className={styles.viewSwitcher}>
            {calViewLabels.map((label, i) => (
              <Fragment key={label}>
                {i > 0 && <span className={styles.viewDivider} />}
                <span className={styles.viewLabel}>{label}</span>
              </Fragment>
            ))}
          </div>

          <div className={styles.searchBtn}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className={styles.monthRow}>
          <span className={styles.monthLabel}>{monthYear}</span>
        </div>

        <div className={styles.grid}>
          <div className={styles.timeColumn}>
            <div className={styles.timeHdrSpacer} />
            <div className={styles.allDayLabel}>{allDayLabel}</div>
            {hours.map((hour) => (
              <div key={hour} className={styles.timeLabel}>
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          <div className={styles.daysContainer}>
            {visibleDays.map(({ date, dayIndex }) => {
              const dayEvents = eventsByDay.get(dayIndex) || []
              const groups = groupOverlapping(dayEvents)
              const today = new Date()
              const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()

              return (
                <div key={dayIndex} className={styles.dayColumn}>
                  <div className={styles.dayHeader}>
                    <span className={styles.dayName}>{dayLabels[dayIndex]}</span>
                    <span className={isToday ? styles.dayNumToday : styles.dayNum}>{date.getDate()}</span>
                  </div>
                  <div className={styles.allDayCell} />
                  <div className={styles.dayBody}>
                    {hours.map((hour) => (
                      <div key={hour} className={styles.hourSlot} />
                    ))}
                    {groups.flatMap((group) =>
                      group.map((event, colIdx) => {
                        const posStyle = getEventStyle(event)
                        const colW = 100 / group.length
                        return (
                          <EventCard
                            key={event.id}
                            event={event}
                            colors={subjectColors.get(event.subject_id) ?? FALLBACK_COLORS}
                            style={{
                              ...posStyle,
                              width: `calc(${colW}% - 4px)`,
                              left: `calc(${(colIdx / group.length) * 100}% + 2px)`,
                              position: 'absolute',
                            }}
                          />
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
