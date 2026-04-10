'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import styles from './page.module.css'

function AuthContent() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

  const handleAuth = (provider: string) => {
    const isHttps = window.location.protocol === 'https:'
    const sameSite = isHttps ? 'None' : 'Lax'
    const secure = isHttps ? ';Secure' : ''
    document.cookie = `auth_redirect=${encodeURIComponent(redirect)};path=/;max-age=600;SameSite=${sameSite}${secure}`
    document.cookie = `auth_provider=${provider};path=/;max-age=600;SameSite=${sameSite}${secure}`
    const callbackUrl = `${window.location.origin}/api/auth/callback?provider=${provider}`
    window.location.href = `${apiBase}/api/v1/auth/${provider}?redirect_after=${encodeURIComponent(callbackUrl)}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
        </div>
        <button type="button" onClick={() => handleAuth('apple')} className={styles.authButton}>
          <img src="/icons/apple-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
          <img src="/icons/apple-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
          {t('apple')}
        </button>
        <button type="button" onClick={() => handleAuth('google')} className={styles.authButton}>
          <img src="/icons/google-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
          <img src="/icons/google-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
          {t('google')}
        </button>
        <p className={styles.agree}>
          {t('agree')}<br />
          {t('agreeOur')}{' '}
          <Link href="/privacy" className={styles.link}>{t('privacyPolicy')}</Link>
          {' & '}
          <Link href="/terms" className={styles.link}>{t('termsOfService')}</Link>
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  )
}
