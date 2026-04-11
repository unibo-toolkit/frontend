'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import type { CalendarListItem } from '@/types/calendar'
import styles from './CalendarCard.module.css'

interface CalendarCardProps {
  calendar: CalendarListItem
  onShare: (calendar: CalendarListItem) => void
  onDelete?: (id: string) => void
}

export default function CalendarCard({ calendar, onShare, onDelete }: CalendarCardProps) {
  const t = useTranslations('dashboard')
  const ct = useTranslations('common')

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (d.getFullYear() <= 1970) return null
    return d.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }

  const lastAccessed = formatDate(calendar.last_accessed_at)
  const expires = formatDate(calendar.ttl_expires_at)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{calendar.name}</h3>
      </div>
      <p className={styles.meta}>
        {t('accessCount', { count: calendar.access_count })}
        {lastAccessed && ` · ${t('lastAccessed', { date: lastAccessed })}`}
        {expires && ` · ${t('expires', { date: expires })}`}
      </p>
      <div className={styles.actions}>
        <Link href={`/cal/${calendar.slug}`}>
          <Button variant="ghost">{t('view')}</Button>
        </Link>
        <Link href={`/dashboard/edit/${calendar.id}`}>
          <Button variant="ghost">{t('edit')}</Button>
        </Link>
        <Button variant="ghost" onClick={() => onShare(calendar)}>
          {t('share')}
        </Button>
        {onDelete && (
          <Button variant="ghost" onClick={() => onDelete(calendar.id)}>
            {ct('delete')}
          </Button>
        )}
      </div>
    </div>
  )
}
