'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { CalendarListItem } from '@/types/calendar'
import styles from './ShareModal.module.css'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  calendar: CalendarListItem | null
}

export default function ShareModal({ isOpen, onClose, calendar }: ShareModalProps) {
  const t = useTranslations('create.created')
  const commonT = useTranslations('common')
  const [copied, setCopied] = useState(false)

  if (!calendar) return null

  const icsUrl = calendar.ics_url
  const webcalUrl = icsUrl.replace('https://', 'webcal://')
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(icsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>{calendar.name}</h2>

        <div className={styles.section}>
          <span className={styles.label}>{t('link')}</span>
          <div className={styles.linkBox}>
            <span className={styles.linkText}>{icsUrl}</span>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.label}>{t('addTo')}</span>
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
              {copied ? commonT('copied') : t('copyLink')}
            </button>
            <a href={icsUrl} download className={styles.calButton}>
              <img src="/icons/cloud-download-dark.svg" width={19} height={19} alt="" className={styles.iconDark} />
              <img src="/icons/cloud-download-light.svg" width={19} height={19} alt="" className={styles.iconLight} />
              {t('downloadIcs')}
            </a>
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="primary" onClick={onClose}>{commonT('done')}</Button>
        </div>
      </div>
    </Modal>
  )
}
