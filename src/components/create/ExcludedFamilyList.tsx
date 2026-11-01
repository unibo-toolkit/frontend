'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { FamilySummary } from '@/hooks/useFamilyExclusions'
import styles from './ExcludedFamilyList.module.css'

interface ExcludedFamilyListProps {
  families: FamilySummary[]
  onRestore: (hash: string) => void
}

const MONDAY = new Date(2024, 0, 1)

function weekdayName(weekday: number, locale: string): string {
  const date = new Date(MONDAY)
  date.setDate(MONDAY.getDate() + weekday)
  const name = date.toLocaleDateString(locale, { weekday: 'short' })
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function shortDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

export default function ExcludedFamilyList({ families, onRestore }: ExcludedFamilyListProps) {
  const t = useTranslations('exclusions')
  const ct = useTranslations('create')
  const locale = useLocale()
  const listRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)

  const checkBottom = () => {
    const el = listRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop <= el.clientHeight + 4)
  }

  useEffect(() => {
    checkBottom()
  }, [families.length])

  if (families.length === 0) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{t('title')}</span>
        <span className={styles.count}>{families.length}</span>
      </div>
      <div className={styles.listWrapper}>
        <div className={styles.list} ref={listRef} onScroll={checkBottom}>
          {families.map((family) => {
            const meta = [`${weekdayName(family.weekday, locale)} · ${family.slot_start}`]
            if (family.group_id) meta.push(`${ct('group')}: ${family.group_id}`)
            if (family.events !== undefined) meta.push(t('lessons', { count: family.events }))
            if (family.first_at && family.last_at && family.events !== undefined && family.events > 1) {
              meta.push(`${shortDate(family.first_at, locale)} – ${shortDate(family.last_at, locale)}`)
            }

            return (
              <button
                key={family.family_hash}
                type="button"
                className={styles.item}
                onClick={() => onRestore(family.family_hash)}
                aria-label={t('restoreLabel', { title: family.title })}
              >
                <span className={styles.title}>{family.title}</span>
                <span className={styles.meta}>
                  {meta.map((part, i) => (
                    <span key={part} className={styles.metaItem}>
                      {i > 0 && <span className={styles.metaDot}> · </span>}
                      {part}
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        {!atBottom && <div className={styles.fade} />}
      </div>
    </div>
  )
}
