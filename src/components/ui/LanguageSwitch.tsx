'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocaleStore } from '@/stores/localeStore'
import styles from './LanguageSwitch.module.css'

export default function LanguageSwitch() {
  const { setLocale } = useLocaleStore()
  const router = useRouter()
  const a11y = useTranslations('a11y')

  const handleSwitch = () => {
    const current = document.documentElement.lang
    const next = current === 'en' ? 'it' : 'en'
    setLocale(next)
    router.refresh()
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
