'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { performLogout } from '@/hooks/useAuth'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LanguageSwitch from '@/components/ui/LanguageSwitch'
import Button from '@/components/ui/Button'
import MobileMenu from './MobileMenu'
import { useTranslations } from 'next-intl'
import styles from './Nav.module.css'

export default function Nav({ showNavLinks = true }: { showNavLinks?: boolean }) {
  const t = useTranslations('nav')
  const { isLoggedIn, user } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await performLogout()
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.png" alt="UniPlanner" width={42} height={42} className={styles.logoImg} />
          <span className={styles.logoText}>UniPlanner</span>
        </Link>
      </div>
      <button
        className={styles.burger}
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <span />
        <span />
        <span />
      </button>
      <div className={styles.right}>
        <ThemeToggle />
        <LanguageSwitch />
        <Link href="/auth" className={styles.showGuest}>
          <Button variant="ghost">{t('login')}</Button>
        </Link>
        <div className={`${styles.avatarWrap} ${styles.showAuth}`} ref={dropdownRef}>
          <button className={styles.avatarBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user?.display_name?.charAt(0) || ''}
              </div>
            )}
          </button>
          {dropdownOpen && (
            <div className={styles.dropdown}>
              <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {t('profile')}
              </Link>
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        showNavLinks={false}
      />
    </nav>
  )
}
