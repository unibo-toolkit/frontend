'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { useCalendars } from '@/hooks/useCalendars'
import CalendarCard from '@/components/dashboard/CalendarCard'
import ShareModal from '@/components/dashboard/ShareModal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import type { CalendarListItem } from '@/types/calendar'
import dashStyles from '../page.module.css'
import styles from './page.module.css'

export default function CalendarsPage() {
  const t = useTranslations('dashboard')
  const a11y = useTranslations('a11y')
  const { user } = useAuthStore()
  const { data: calendars, isLoading } = useCalendars()
  const [shareCalendar, setShareCalendar] = useState<CalendarListItem | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!calendars) return []
    if (!search.trim()) return calendars
    return calendars.filter((cal) =>
      cal.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [calendars, search])

  return (
    <div className={dashStyles.page}>
      <div className={`${dashStyles.sidebar} ${sidebarOpen ? dashStyles.sidebarOpen : ''}`}>
        <div className={dashStyles.sidebarTop}>
          <div className={dashStyles.sidebarLogo}>
            <Link href="/" className={dashStyles.logoLink}>
              <Image src="/logo.png" alt="UniPlanner" width={32} height={32} className={dashStyles.logoImg} />
              <span className={dashStyles.logoText}>UniPlanner</span>
            </Link>
          </div>
          <div className={dashStyles.profile}>
            <div className={dashStyles.avatar}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className={dashStyles.avatarImg} />
              ) : (
                <div className={dashStyles.avatarPlaceholder}>
                  {user?.display_name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className={dashStyles.profileInfo}>
              <span className={dashStyles.profileName}>{user?.display_name}</span>
              <span className={dashStyles.profileEmail}>{user?.email}</span>
            </div>
          </div>
          <nav className={dashStyles.sidebarNav}>
            <Link href="/dashboard" className={dashStyles.navItem}>
              <img src="/icons/home-dark.svg" width={18} height={19} alt="" className={`${dashStyles.navIcon} ${dashStyles.iconDark}`} />
              <img src="/icons/home-light.svg" width={18} height={19} alt="" className={`${dashStyles.navIcon} ${dashStyles.iconLight}`} />
              {t('dashboardLink')}
            </Link>
            <Link href="/dashboard/calendars" className={`${dashStyles.navItem} ${dashStyles.navActive}`}>
              <img src="/icons/calendar-dark.svg" width={16} height={17} alt="" className={`${dashStyles.navIcon} ${dashStyles.iconDark}`} />
              <img src="/icons/calendar-light.svg" width={16} height={17} alt="" className={`${dashStyles.navIcon} ${dashStyles.iconLight}`} />
              {t('myCalendar')}
            </Link>
            <Link href="/dashboard/settings" className={dashStyles.navItem}>
              <img src="/icons/settings-dark.svg" width={19} height={18} alt="" className={`${dashStyles.navIcon} ${dashStyles.iconDark}`} />
              <img src="/icons/settings-light.svg" width={19} height={18} alt="" className={`${dashStyles.navIcon} ${dashStyles.iconLight}`} />
              {t('settings')}
            </Link>
          </nav>
        </div>
        <div className={dashStyles.sidebarBottom}>
          <Link href="/create">
            <Button variant="primary" fullWidth>+ {t('createNew')}</Button>
          </Link>
        </div>
      </div>

      {sidebarOpen && (
        <div className={dashStyles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      <main className={dashStyles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('calendars')}</h1>
          <div className={styles.headerActions}>
            <button className={dashStyles.burger} onClick={() => setSidebarOpen(true)} aria-label={a11y('menu')}>
              <span /><span /><span />
            </button>
          </div>
        </div>

        <Link href="/create" className={styles.mobileCreateBtn}>
          <Button variant="primary" fullWidth>+ {t('createNew')}</Button>
        </Link>

        <div className={styles.search}>
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Skeleton height="180px" />
        ) : filtered.length > 0 ? (
          <div className={styles.calendarList}>
            {filtered.map((cal) => (
              <CalendarCard
                key={cal.id}
                calendar={cal}
                onShare={setShareCalendar}
              />
            ))}
          </div>
        ) : calendars && calendars.length === 0 ? (
          <div className={styles.emptyCard}>
            <h3 className={styles.emptyTitle}>{t('emptyTitle')}</h3>
            <p className={styles.emptyDesc}>{t('emptyDesc')}</p>
            <Link href="/create">
              <Button variant="primary">{t('createFirst')} →</Button>
            </Link>
          </div>
        ) : (
          <p className={dashStyles.empty}>{t('noCalendars')}</p>
        )}

        <p className={styles.count}>
          {t('showingCalendars', { count: filtered.length })}
        </p>
      </main>

      <ShareModal isOpen={!!shareCalendar} onClose={() => setShareCalendar(null)} calendar={shareCalendar} />
    </div>
  )
}
