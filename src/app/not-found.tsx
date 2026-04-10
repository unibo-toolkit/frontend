'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useTranslations } from 'next-intl'
import styles from './error/error.module.css'

export default function NotFound() {
  const t = useTranslations('errors')

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('notFound')}</h1>
        <p className={styles.desc}>{t('notFoundDesc')}</p>
        <Link href="/">
          <Button
            variant="primary"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          >
            {t('goHome')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
