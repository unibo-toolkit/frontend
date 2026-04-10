'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { performLogout } from '@/hooks/useAuth'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LanguageSwitch from '@/components/ui/LanguageSwitch'
import Button from '@/components/ui/Button'
import styles from './MobileMenu.module.css'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  showNavLinks?: boolean
}

export default function MobileMenu({ isOpen, onClose, showNavLinks = true }: MobileMenuProps) {
  const t = useTranslations('nav')
  const { isLoggedIn } = useAuthStore()

  const handleLogout = async () => {
    onClose()
    await performLogout()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.menu}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <div className={styles.header}>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.content}>
              <div className={styles.controls}>
                <LanguageSwitch />
                <ThemeToggle />
              </div>
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" onClick={onClose}>
                    <Button variant="ghost" fullWidth>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {t('profile')}
                    </Button>
                  </Link>
                  <Button variant="ghost" fullWidth onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {t('logout')}
                  </Button>
                </>
              ) : (
                <Link href="/auth" onClick={onClose}>
                  <Button variant="ghost" fullWidth>{t('login')}</Button>
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
