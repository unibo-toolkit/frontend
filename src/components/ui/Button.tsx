'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'text'
  children: ReactNode
  icon?: ReactNode
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  children,
  icon,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`}
      {...props}
    >
      <span className={styles.content}>{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </button>
  )
}
