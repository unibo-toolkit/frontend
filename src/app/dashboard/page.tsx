'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { useLocaleStore } from '@/stores/localeStore'
import { useCalendars } from '@/hooks/useCalendars'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import CalendarCard from '@/components/dashboard/CalendarCard'
import ShareModal from '@/components/dashboard/ShareModal'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import type { CalendarListItem } from '@/types/calendar'
import styles from './page.module.css'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { user } = useAuthStore()
  const { locale } = useLocaleStore()
  const { data: calendars, isLoading } = useCalendars()
  const { data: stats } = useDashboardStats()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shareCalendar, setShareCalendar] = useState<CalendarListItem | null>(null)

  const formatNextEvent = (nextEvent: { title: string; start_datetime: string } | null | undefined): string | null => {
    if (!nextEvent) return null

    const eventDate = new Date(nextEvent.start_datetime)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())

    const timeStr = eventDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })

    if (eventDay.getTime() === today.getTime()) {
      return `${t('stats.today')}, ${timeStr}`
    }
    if (eventDay.getTime() === tomorrow.getTime()) {
      return `${t('stats.tomorrow')}, ${timeStr}`
    }

    const dayNum = eventDate.getDate()
    const monthName = eventDate.toLocaleDateString(locale, { month: 'long' })
    return `${dayNum} ${monthName}, ${timeStr}`
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.sidebarLogo}>
            <Link href="/" className={styles.logoLink}>
              <Image src="/logo.png" alt="UniPlanner" width={32} height={32} className={styles.logoImg} />
              <span className={styles.logoText}>UniPlanner</span>
            </Link>
          </div>
          <div className={styles.profile}>
            <div className={styles.avatar}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.display_name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.display_name}</span>
              <span className={styles.profileEmail}>{user?.email}</span>
            </div>
          </div>
          <nav className={styles.sidebarNav}>
            <Link href="/dashboard" className={`${styles.navItem} ${styles.navActive}`}>
              <img src="/icons/home-dark.svg" width={18} height={19} alt="" className={`${styles.navIcon} ${styles.iconDark}`} />
              <img src="/icons/home-light.svg" width={18} height={19} alt="" className={`${styles.navIcon} ${styles.iconLight}`} />
              Dashboard
            </Link>
            <Link href="/dashboard/calendars" className={styles.navItem}>
              <img src="/icons/calendar-dark.svg" width={16} height={17} alt="" className={`${styles.navIcon} ${styles.iconDark}`} />
              <img src="/icons/calendar-light.svg" width={16} height={17} alt="" className={`${styles.navIcon} ${styles.iconLight}`} />
              {t('myCalendar')}
            </Link>
            <Link href="/dashboard/settings" className={styles.navItem}>
              <img src="/icons/settings-dark.svg" width={19} height={18} alt="" className={`${styles.navIcon} ${styles.iconDark}`} />
              <img src="/icons/settings-light.svg" width={19} height={18} alt="" className={`${styles.navIcon} ${styles.iconLight}`} />
              {t('settings')}
            </Link>
          </nav>
        </div>
        <div className={styles.sidebarBottom}>
          <Link href="/create">
            <Button variant="primary" fullWidth>+ {t('createNew')}</Button>
          </Link>
        </div>
      </div>

      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      <main className={styles.main}>
        <div className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>{t('welcome', { name: user?.display_name || '' })}</h1>
          <button className={styles.burger} onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>
              <span>{t('stats.calendars')}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span className={styles.statValue}>{stats?.calendars_count ?? '\u2013'}</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>
              <span>{t('stats.thisWeek')}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span className={styles.statValue}>{`${stats?.this_week.events_count ?? 0} ${t('stats.events')}`}</span>
            {formatNextEvent(stats?.next_event) && (
              <span className={styles.statSub}>{t('stats.nextEvent')}: {formatNextEvent(stats?.next_event)}</span>
            )}
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>
              <span>{t('stats.hoursWeek')}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M10 5V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className={styles.statValue}>{`${Math.round(stats?.this_week.total_hours ?? 0)}h`}</span>
            <span className={styles.statSub}>{`${stats?.this_month.total_hours ?? 0}h ${t('stats.thisMonth')}`}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('calendars')}</h2>
          {isLoading ? (
            <div className={styles.skeletons}>
              <Skeleton height="180px" />
              <Skeleton height="180px" />
            </div>
          ) : calendars && calendars.length > 0 ? (
            <div className={styles.calendarList}>
              {calendars.map((cal) => (
                <CalendarCard
                  key={cal.id}
                  calendar={cal}
                  onShare={setShareCalendar}
                />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>{t('noCalendars')}</p>
          )}
        </div>
      </main>

      <ShareModal
        isOpen={!!shareCalendar}
        onClose={() => setShareCalendar(null)}
        calendar={shareCalendar}
      />
    </div>
  )
}
