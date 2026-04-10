'use client'

import ProgressBar from '@/components/ui/ProgressBar'
import styles from './StepWizard.module.css'

interface StepWizardProps {
  step: number
  totalSteps: number
  label: string
  children: React.ReactNode
}

export default function StepWizard({ step, totalSteps, label, children }: StepWizardProps) {
  return (
    <div className={styles.wizard}>
      <ProgressBar step={step} totalSteps={totalSteps} label={label} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
