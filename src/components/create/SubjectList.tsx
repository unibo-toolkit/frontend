'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { SubjectColorPair } from '@/lib/colors'
import styles from './SubjectList.module.css'

interface SubjectItem {
  id: string
  title: string
  module_code?: string
  group_id?: string | null
  credits: number
  professor?: string | null
}

interface SubjectListProps {
  subjects: SubjectItem[]
  selected: Set<string>
  subjectColors: Map<string, SubjectColorPair>
  onToggle?: (id: string) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  isLoading?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export default function SubjectList({
  subjects,
  selected,
  subjectColors,
  onToggle,
  onSelectAll,
  onDeselectAll,
  isLoading,
  disabled,
  readOnly,
}: SubjectListProps) {
  const t = useTranslations('create')
  const listRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(false)
  const [search, setSearch] = useState('')

  const checkBottom = () => {
    const el = listRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop <= el.clientHeight + 4)
  }

  const handleScroll = checkBottom

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.label}>{t('subjects')}</span>
        </div>
        <div className={styles.listWrapper}>
          <div className={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
          <div className={styles.fade} />
        </div>
      </div>
    )
  }

  const filtered = search.trim()
    ? subjects.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.professor?.toLowerCase().includes(search.toLowerCase())
      )
    : subjects

  useEffect(() => {
    checkBottom()
  }, [filtered.length])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{t('subjects')}</span>
        {!readOnly && (
          <div className={styles.actions}>
            <button className={styles.action} onClick={onDeselectAll} disabled={disabled}>{t('deselectAll')}</button>
            <button className={styles.action} onClick={onSelectAll} disabled={disabled}>{t('selectAll')}</button>
          </div>
        )}
      </div>
      {!readOnly && (
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchSubjects')}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>
              <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      )}
      <div className={styles.listWrapper}>
        <div className={styles.list} ref={listRef} onScroll={handleScroll}>
          {filtered.map((subject) => {
            const isSelected = selected.has(subject.id)
            const colorPair = subjectColors.get(subject.id)

            const metaParts: { key: string; value: string }[] = []
            if (subject.module_code) metaParts.push({ key: 'module', value: `${t('module')}: ${subject.module_code}` })
            if (subject.professor) metaParts.push({ key: 'professor', value: subject.professor })
            if (subject.group_id) metaParts.push({ key: 'group', value: `${t('group')}: ${subject.group_id}` })

            return (
              <div
                key={subject.id}
                className={`${styles.item} ${isSelected ? styles.selected : ''} ${readOnly ? styles.readOnly : ''}`}
                onClick={readOnly ? undefined : () => onToggle?.(subject.id)}
                role={readOnly ? undefined : 'button'}
                tabIndex={readOnly ? undefined : 0}
                style={isSelected && colorPair ? { borderLeftColor: colorPair.border } : undefined}
              >
                {!readOnly && (
                  <div
                    className={styles.checkbox}
                    style={isSelected ? { backgroundColor: '#32c956', borderColor: '#32c956' } : undefined}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
                <div className={styles.info}>
                  <span className={styles.title}>{subject.title}</span>
                  {metaParts.length > 0 && (
                    <span className={styles.meta}>
                      {metaParts.map((p, i) => (
                        <span key={p.key}>
                          {i > 0 && <span className={styles.metaDot}> · </span>}
                          <span className={styles.metaItem}>{p.value}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {subject.credits != null && subject.credits > 0 && (
                  <div className={styles.cfuBadge}>
                    {subject.credits} {t('credits')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {filtered.length > 0 && !atBottom && <div className={styles.fade} />}
      </div>
    </div>
  )
}
