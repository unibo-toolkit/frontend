'use client'

import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import styles from './Footer.module.css'

export default function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="UniPlanner" width={28} height={28} style={{ borderRadius: 6 }} />
          <span className={styles.logoText}>UniPlanner</span>
        </div>
        <div className={styles.links}>
          <a href="https://github.com/unibo-toolkit" target="_blank" rel="noopener noreferrer">
            {t('github')}
          </a>
          <Link href="/privacy">{t('privacy')}</Link>
          <Link href="/terms">{t('terms')}</Link>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>{t('madeFor')}</span>
        <span>{t('copyright')}</span>
      </div>
    </footer>
  )
}
