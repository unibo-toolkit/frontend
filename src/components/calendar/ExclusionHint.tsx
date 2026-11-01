'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import styles from './ExclusionHint.module.css'

const STORAGE_KEY = 'exclusion-hint-dismissed'
const VIDEO_SOURCES = [
  { src: '/video/exclusions.webm', type: 'video/webm; codecs=av01.0.08M.08' },
  { src: '/video/exclusions.mp4', type: 'video/mp4' },
]
const VIDEO_POSTER = '/video/exclusions-poster.webp'

let videoPreloaded = false

function preloadVideo() {
  if (videoPreloaded) return
  videoPreloaded = true
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  for (const { src, type } of VIDEO_SOURCES) {
    const source = document.createElement('source')
    source.src = src
    source.type = type
    video.appendChild(source)
  }
  video.load()
}

export function useExclusionHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== '1')
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
  }, [])

  return { visible, dismiss }
}

export default function ExclusionHint({ visible }: { visible: boolean }) {
  const t = useTranslations('exclusions')
  const [showModal, setShowModal] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  return (
    <>
      {visible && (
        <div className={styles.hint}>
          <svg className={styles.icon} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className={styles.text}>
            <span className={styles.title}>{t('hintTitle')}</span>
            <span className={styles.body}>{t('hintText')}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowModal(true)}
            onPointerEnter={preloadVideo}
            onFocus={preloadVideo}
            className={styles.learnMore}
          >
            {t('learnMore')}
          </Button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className={styles.modal}>
          <h2 className={styles.modalTitle}>{t('modalTitle')}</h2>
          <video
            className={styles.video}
            poster={VIDEO_POSTER}
            preload="auto"
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            disablePictureInPicture
            aria-hidden="true"
          >
            {VIDEO_SOURCES.map((source) => <source key={source.src} {...source} />)}
          </video>
          <ol className={styles.steps}>
            <li>{t('step1')}</li>
            <li>{t('step2')}</li>
            <li>{t('step3')}</li>
          </ol>
          <div className={styles.modalActions}>
            <Button variant="primary" onClick={() => setShowModal(false)}>{t('gotIt')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
