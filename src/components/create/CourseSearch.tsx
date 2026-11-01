'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchCourses } from '@/hooks/useCourses'
import type { Course } from '@/types/calendar'
import styles from './CourseSearch.module.css'

interface CourseSearchProps {
  onSelect: (course: Course) => void
  selectedCourse: Course | null
  courseType: string
  onCourseTypeChange: (type: string) => void
}

const LANG_FLAGS: Record<string, string> = {
  it: '/icons/flags/it.svg',
  en: '/icons/flags/gb.svg',
  de: '/icons/flags/de.svg',
  fr: '/icons/flags/fr.svg',
  es: '/icons/flags/es.svg',
}

const SEARCH_DEBOUNCE_MS = 250

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


function formatCourseType(type: string | undefined, locale: string): string | null {
  if (!type) return null
  return COURSE_TYPE_LABELS[type]?.[locale] ?? COURSE_TYPE_LABELS[type]?.['en'] ?? type
}

function normalizeCampus(campus: string | null | undefined): string | null {
  if (!campus) return null
  return CAMPUS_NAMES[campus.toUpperCase()] ?? campus
}

const FILTER_OPTIONS = [
  { value: '', key: 'filterAll' },
  { value: 'Bachelor', key: 'filterBachelor' },
  { value: 'Master', key: 'filterMaster' },
  { value: 'SingleCycleMaster', key: 'filterSingleCycle' },
] as const

export default function CourseSearch({ onSelect, selectedCourse, courseType, onCourseTypeChange }: CourseSearchProps) {
  const t = useTranslations('create')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isPlaceholderData } = useSearchCourses(debouncedQuery, locale, isOpen, courseType || undefined)
  const isStale = isPlaceholderData || query.trim() !== debouncedQuery

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    for (const src of Object.values(LANG_FLAGS)) new Image().src = src
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [selectedCourse])

  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      const target = e.target as Element
      const inside =
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target) ||
        (filtersRef.current?.contains(target) && target.closest('button'))
      if (!inside) {
        setIsOpen(false)
        if (document.activeElement === inputRef.current) inputRef.current?.blur()
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  const open = () => {
    setIsOpen(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const displayValue = isOpen ? query : (selectedCourse?.title ?? query)

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters} ref={filtersRef}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.filterChip} ${courseType === opt.value ? styles.filterActive : ''}`}
            onClick={() => onCourseTypeChange(opt.value)}
            type="button"
          >
            {t(opt.key)}
          </button>
        ))}
      </div>
      <input
        className={styles.input}
        type="text"
        placeholder={t('searchPlaceholder')}
        value={displayValue}
        ref={inputRef}
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={open}
        onClick={() => !isOpen && open()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
          if (e.key === 'Enter') inputRef.current?.blur()
        }}
      />
      {isOpen && (
        <div className={`${styles.dropdown} ${isStale && data ? styles.stale : ''}`} ref={dropdownRef}>
          {isLoading && !data ? (
            <div className={styles.loading}>{t('searching')}</div>
          ) : !data?.items.length ? (
            <div className={styles.empty}>{t('noResults')}</div>
          ) : (
            data.items.map((course) => {
              const languages = course.languages || []
              const metaLine = [
                formatCourseType(course.course_type, locale),
                course.duration_years ? `${course.duration_years} ${t('years')}` : null,
                normalizeCampus(course.campus),
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
                  }}
                >
                  <span className={styles.courseTitle}>{course.title}</span>
                  {(metaLine || languages.length > 0) && (
                    <span className={styles.courseMeta}>
                      {metaLine}
                      {metaLine && languages.length > 0 && ' · '}
                      {languages.map((lang) => {
                        const flag = LANG_FLAGS[lang.toLowerCase()]
                        return flag ? (
                          <img key={lang} src={flag} alt={lang.toUpperCase()} className={styles.flag} draggable={false} />
                        ) : (
                          <span key={lang} className={styles.flagText}>{lang.toUpperCase()}</span>
                        )
                      })}
                    </span>
                  )}
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
