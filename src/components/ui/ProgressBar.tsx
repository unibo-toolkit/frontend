'use client'

import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  step: number
  totalSteps: number
  label: string
}

export default function ProgressBar({ step, totalSteps, label }: ProgressBarProps) {
  const percentage = Math.round((step / totalSteps) * 100)

  return (
    <div className={styles.wrapper}>
      <div className={styles.info}>
        <span className={styles.label}>{label}</span>
        <span className={styles.percentage}>{percentage}%</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
