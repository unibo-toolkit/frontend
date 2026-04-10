'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { performLogout } from '@/hooks/useAuth'
import api from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from './page.module.css'
import dashboardStyles from '../page.module.css'

type Tab = 'profile' | 'danger'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const dt = useTranslations('dashboard')
  const ct = useTranslations('common')
  const { user, setUser } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setDisplayName(user.display_name)
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/api/v1/users/me/', { display_name: displayName })
      const { data } = await api.get<NonNullable<typeof user>>('/api/v1/users/me/')
      setUser(data)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    await api.delete('/api/v1/users/me/')
    await performLogout()
  }

  const handleLogoutAll = async () => {
    await api.post('/api/v1/auth/logout-all', { refresh_token: '' })
    await performLogout()
  }

  return (
    <div className={dashboardStyles.page}>
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
              <img src="/icons/home-dark.svg" width={18} height={19} alt="" className={`${dashboardStyles.navIcon} ${dashboardStyles.iconDark}`} />
              <img src="/icons/home-light.svg" width={18} height={19} alt="" className={`${dashboardStyles.navIcon} ${dashboardStyles.iconLight}`} />
              Dashboard
            </Link>
            <Link href="/dashboard/calendars" className={dashboardStyles.navItem}>
              <img src="/icons/calendar-dark.svg" width={16} height={17} alt="" className={`${dashboardStyles.navIcon} ${dashboardStyles.iconDark}`} />
              <img src="/icons/calendar-light.svg" width={16} height={17} alt="" className={`${dashboardStyles.navIcon} ${dashboardStyles.iconLight}`} />
              {dt('myCalendar')}
            </Link>
            <Link href="/dashboard/settings" className={`${dashboardStyles.navItem} ${dashboardStyles.navActive}`}>
              <img src="/icons/settings-dark.svg" width={19} height={18} alt="" className={`${dashboardStyles.navIcon} ${dashboardStyles.iconDark}`} />
              <img src="/icons/settings-light.svg" width={19} height={18} alt="" className={`${dashboardStyles.navIcon} ${dashboardStyles.iconLight}`} />
              {dt('settings')}
            </Link>
          </nav>
        </div>
      </div>

      {sidebarOpen && (
        <div className={dashboardStyles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
          <button className={dashboardStyles.burger} onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {t('tabs.profile')}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'danger' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            {t('tabs.dangerZone')}
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('profileInfo')}</h2>
              <p className={styles.cardSubtitle}>{t('profileInfoDesc')}</p>
            </div>

            <div className={styles.pictureBlock}>
              <span className={styles.fieldLabel}>{t('profilePicture')}</span>
              <div className={styles.avatarLarge}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className={styles.avatarLargeImg} />
                ) : (
                  <div className={styles.avatarLargePlaceholder}>
                    {user?.display_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('displayName')}</label>
              <input
                type="text"
                className={styles.input}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>{t('email')}</label>
              <input
                type="text"
                className={styles.input}
                value={user?.email || ''}
                disabled
              />
              <p className={styles.fieldHint}>{t('emailHint')}</p>
            </div>

            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? '...' : t('save')}
            </Button>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('tabs.dangerZone')}</h2>
              <p className={styles.cardSubtitle}>{t('dangerDesc')}</p>
            </div>

            <div className={styles.dangerRow}>
              <div className={styles.dangerInfo}>
                <h3 className={styles.dangerTitle}>{t('logout')}</h3>
                <p className={styles.dangerText}>{t('logoutDesc')}</p>
              </div>
              <Button variant="ghost" onClick={performLogout}>{t('logout')}</Button>
            </div>

            <div className={styles.divider} />

            <div className={styles.dangerRow}>
              <div className={styles.dangerInfo}>
                <h3 className={styles.dangerTitle}>{t('logoutAll')}</h3>
                <p className={styles.dangerText}>{t('logoutAllDesc')}</p>
              </div>
              <Button variant="ghost" onClick={handleLogoutAll}>{t('logoutAll')}</Button>
            </div>

            <div className={styles.divider} />

            <div className={styles.dangerRow}>
              <div className={styles.dangerInfo}>
                <h3 className={styles.dangerTitle}>{t('deleteAccount')}</h3>
                <p className={styles.dangerText}>{t('deleteAccountDesc')}</p>
              </div>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => setShowDeleteConfirm(true)}
              >
                {t('deleteAccount')}
              </button>
            </div>
          </div>
        )}

        <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{t('deleteAccount')}</h2>
            <p className={styles.modalDesc}>{t('deleteConfirm')}</p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>{ct('cancel')}</Button>
              <Button variant="primary" onClick={handleDeleteAccount}>{ct('confirm')}</Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  )
}
