'use client'

import styles from './CalendarNav.module.css'

interface CalendarNavProps {
  onWeekChange: (direction: 'prev' | 'next') => void
}

export default function CalendarNav({ onWeekChange }: CalendarNavProps) {
  return (
    <div className={styles.nav}>
      <button className={styles.btn} onClick={() => onWeekChange('prev')} aria-label="Previous week">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className={styles.btn} onClick={() => onWeekChange('next')} aria-label="Next week">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
