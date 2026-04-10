'use client'

import { CSSProperties } from 'react'
import type { TimetableEvent } from '@/types/api'
import type { SubjectColorPair } from '@/lib/colors'
import styles from './EventCard.module.css'

interface EventCardProps {
  event: TimetableEvent
  colors: SubjectColorPair
  style?: CSSProperties
}

export default function EventCard({ event, colors, style }: EventCardProps) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

  return (
    <div
      className={styles.card}
      style={{ ...style, backgroundColor: colors.bg }}
      title={`${event.title}${event.professor ? '\n' + event.professor : ''}${event.classroom ? '\n' + event.classroom.name : ''}`}
    >
      <div className={styles.stripe} style={{ backgroundColor: colors.border }} />
      <div className={styles.content}>
        <span className={styles.title} style={{ color: colors.text }}>
          {event.title}
        </span>
        {event.classroom && (
          <span className={styles.meta} style={{ color: colors.text }}>
            <svg className={styles.icon} viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.1 6 11 6 11C6 11 9.5 7.1 9.5 4.5C9.5 2.57 7.93 1 6 1ZM6 5.75C5.31 5.75 4.75 5.19 4.75 4.5C4.75 3.81 5.31 3.25 6 3.25C6.69 3.25 7.25 3.81 7.25 4.5C7.25 5.19 6.69 5.75 6 5.75Z"/>
            </svg>
            {event.classroom.name}
          </span>
        )}
        <span className={styles.meta} style={{ color: colors.text }}>
          <svg className={styles.icon} viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/>
            <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {fmt(event.start_datetime)} – {fmt(event.end_datetime)}
        </span>
      </div>
    </div>
  )
}
