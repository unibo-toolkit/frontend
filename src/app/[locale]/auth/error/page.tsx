'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Button from '@/components/ui/Button'
import styles from './page.module.css'

function AuthErrorContent() {
  const t = useTranslations('auth.error')
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'server'

  const message = reason === 'declined' ? t('declined') : t('server')

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 16L32 32M32 16L16 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.desc}>{message}</p>
        <Link href="/auth">
          <Button variant="primary">{t('tryAgain')}</Button>
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  )
}
