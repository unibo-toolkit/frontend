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
            <Button
              variant="outline"
              fullWidth
              iconPosition="left"
              href={webcalUrl}
              icon={
                <>
                  <img src="/icons/apple-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
                  <img src="/icons/apple-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
                </>
              }
            >
              {t('appleCalendar')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              iconPosition="left"
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon={
                <>
                  <img src="/icons/google-dark.svg" width={20} height={20} alt="" className={styles.iconDark} />
                  <img src="/icons/google-light.svg" width={20} height={20} alt="" className={styles.iconLight} />
                </>
              }
            >
              {t('googleCalendar')}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              iconPosition="left"
              onClick={handleCopy}
              icon={
                <>
                  <img src="/icons/link-copy-dark.svg" width={17} height={17} alt="" className={styles.iconDark} />
                  <img src="/icons/link-copy-light.svg" width={17} height={17} alt="" className={styles.iconLight} />
                </>
              }
            >
              {copied ? commonT('copied') : t('copyLink')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              iconPosition="left"
              href={icsUrl}
              download
              icon={
                <>
                  <img src="/icons/cloud-download-dark.svg" width={19} height={19} alt="" className={styles.iconDark} />
                  <img src="/icons/cloud-download-light.svg" width={19} height={19} alt="" className={styles.iconLight} />
                </>
              }
            >
              {t('downloadIcs')}
            </Button>
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="primary" onClick={onClose}>{commonT('done')}</Button>
        </div>
      </div>
    </Modal>
  )
}
