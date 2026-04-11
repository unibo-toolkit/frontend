'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Accordion from '@/components/ui/Accordion'
import InfoCard from '@/components/ui/InfoCard'
import { useAuthStore } from '@/stores/authStore'
import type { Calendar } from '@/types/calendar'
import styles from './CreatedModal.module.css'

interface CreatedModalProps {
  isOpen: boolean
  onClose: () => void
  calendar: Calendar | null
  eventCount?: number
}

export default function CreatedModal({ isOpen, onClose, calendar, eventCount }: CreatedModalProps) {
  const t = useTranslations('create.created')
  const { isLoggedIn } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)

  if (!calendar) return null

  const icsUrl = calendar.ics_url
  const webcalUrl = icsUrl.replace('https://', 'webcal://')
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl)
    } catch {}
    setCopied(true)
    setShowToast(true)
    setTimeout(() => {
      setCopied(false)
      setShowToast(false)
    }, 2500)
  }


  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className={styles.content}>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.info}>
            {t('info', { name: calendar.name, count: eventCount ?? '…' })}
          </p>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('link')}</span>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{icsUrl}</span>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>{t('addTo')}</span>
            <div className={styles.buttons}>
              <a href={webcalUrl} className={styles.calButton}>
                <img src="/icons/apple-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
                <img src="/icons/apple-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
                {t('appleCalendar')}
              </a>
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={styles.calButton}>
                <img src="/icons/google-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
                <img src="/icons/google-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
                {t('googleCalendar')}
              </a>
              <button type="button" className={styles.calButton} onClick={handleCopy}>
                <img src="/icons/link-copy-dark.svg" width={17} height={17} alt="" className={styles.iconDark} />
                <img src="/icons/link-copy-light.svg" width={17} height={17} alt="" className={styles.iconLight} />
                {copied ? t('copied') : t('copyLink')}
              </button>
              <a href={icsUrl} download className={styles.calButton}>
                <img src="/icons/cloud-download-dark.svg" width={19} height={19} alt="" className={styles.iconDark} />
                <img src="/icons/cloud-download-light.svg" width={19} height={19} alt="" className={styles.iconLight} />
                {t('downloadIcs')}
              </a>
            </div>
          </div>

          <div className={styles.howToSection}>
            <span className={styles.sectionLabel}>{t('howToAdd')}</span>
            <Accordion title="Apple Calendar">
              <div className={styles.instructions}>
                <p>{t('howToApple')}</p>
              </div>
            </Accordion>
            <Accordion title="Google Calendar">
              <div className={styles.instructions}>
                <p>{t('howToGoogle')}</p>
              </div>
            </Accordion>
            <Accordion title="Outlook">
              <div className={styles.instructions}>
                <p>{t('howToOutlook')}</p>
              </div>
            </Accordion>
          </div>

          {!isLoggedIn && (
            <InfoCard variant="warning">
              {t('signInPrompt')}
            </InfoCard>
          )}

          <div className={styles.footer}>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={onClose}>
                  <Button variant="primary">{t('goToDashboard')}</Button>
                </Link>
                <Link href="/create" onClick={onClose}>
                  <Button variant="ghost">{t('createAnother')}</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/" onClick={onClose}>
                  <Button variant="ghost">{t('goToHome')}</Button>
                </Link>
                <Link href={`/auth?redirect=${encodeURIComponent(`/cal/${calendar.slug}?autoclaim=1`)}`} onClick={onClose}>
                  <Button variant="primary">{t('claimCalendar')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </Modal>

      {showToast && (
        <div className={styles.toast}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#22c55e"/>
            <path d="M5 8l2.5 2.5L11 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('copied')}
        </div>
      )}
    </>
  )
}
