'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import styles from './LanguageSwitch.module.css'

export default function LanguageSwitch() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const a11y = useTranslations('a11y')
  const [, startTransition] = useTransition()

  const handleSwitch = () => {
    const next: Locale = locale === 'en' ? 'it' : 'en'
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <button
      className={styles.switch}
      onClick={handleSwitch}
      aria-label={a11y('switchLanguage')}
    >
      <span className={`${styles.label} ${styles.labelEn}`}>EN</span>
      <span className={`${styles.label} ${styles.labelIt}`}>IT</span>
    </button>
  )
}
