'use client'

import { useTranslations } from 'next-intl'
import styles from './error/error.module.css'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('errors')

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('serverError')}</h1>
        <p className={styles.desc}>{t('serverErrorDesc')}</p>
        <button className={styles.button} onClick={reset}>{t('tryAgain')}</button>
      </div>
    </div>
  )
}
