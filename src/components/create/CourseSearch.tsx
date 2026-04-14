'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchCourses } from '@/hooks/useCourses'
import Twemoji from '@/components/ui/Twemoji'
import type { Course } from '@/types/calendar'
import styles from './CourseSearch.module.css'

interface CourseSearchProps {
  onSelect: (course: Course) => void
  selectedCourse: Course | null
}

const LANG_FLAGS: Record<string, string> = {
  it: '🇮🇹',
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
}

const COURSE_TYPE_LABELS: Record<string, Record<string, string>> = {
  Bachelor: { en: "Bachelor's Degree", it: 'Laurea Triennale' },
  Master: { en: "Master's Degree", it: 'Laurea Magistrale' },
  SingleCycleMaster: { en: "Single-cycle Master's", it: 'Laurea Magistrale a Ciclo Unico' },
}

const CAMPUS_NAMES: Record<string, string> = {
  BOLOGNA: 'Bologna',
  CESENA: 'Cesena',
  FORLI: 'Forlì',
  FORLÌ: 'Forlì',
  RAVENNA: 'Ravenna',
  RIMINI: 'Rimini',
}

function formatLanguages(langs: string[]): string {
  return langs.map((l) => LANG_FLAGS[l.toLowerCase()] || l.toUpperCase()).join(' ')
}

function formatCourseType(type: string | undefined, locale: string): string | null {
  if (!type) return null
  return COURSE_TYPE_LABELS[type]?.[locale] ?? COURSE_TYPE_LABELS[type]?.['en'] ?? type
}

function normalizeCampus(campus: string | undefined): string | null {
  if (!campus) return null
  return CAMPUS_NAMES[campus.toUpperCase()] ?? campus
}

export default function CourseSearch({ onSelect, selectedCourse }: CourseSearchProps) {
  const t = useTranslations('create')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useSearchCourses(query, locale, isOpen)

  useEffect(() => {
    setQuery('')
    setIsOpen(false)
  }, [selectedCourse])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayValue = isOpen ? query : (selectedCourse?.title ?? '')

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <input
        className={styles.input}
        type="text"
        placeholder={t('searchPlaceholder')}
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setIsOpen(true)
        }}
      />
      {isOpen && (
        <div className={styles.dropdown}>
          {isLoading ? (
            <div className={styles.loading}>{t('searching')}</div>
          ) : !data?.items.length ? (
            <div className={styles.empty}>{t('noResults')}</div>
          ) : (
            data.items.map((course) => {
              const flags = formatLanguages(course.languages || [])
              const metaLine = [
                formatCourseType(course.course_type, locale),
                course.duration_years ? `${course.duration_years} ${t('years')}` : null,
                normalizeCampus(course.campus),
                flags || null,
              ]
                .filter(Boolean)
                .join(' · ')

              return (
                <button
                  key={course.id}
                  className={styles.item}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(course)
                    setIsOpen(false)
                    setQuery('')
                  }}
                >
                  <span className={styles.courseTitle}>{course.title}</span>
                  {metaLine && <Twemoji className={styles.courseMeta}>{metaLine}</Twemoji>}
                  {course.area && <span className={styles.courseArea}>{course.area}</span>}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
