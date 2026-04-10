'use client'

import { ReactNode } from 'react'
import styles from './InfoCard.module.css'

interface InfoCardProps {
  variant?: 'warning' | 'info'
  children: ReactNode
}

export default function InfoCard({ variant = 'warning', children }: InfoCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <svg className={styles.icon} width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
