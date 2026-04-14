'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import twemoji from '@twemoji/api'

interface TwemojiProps {
  children: ReactNode
  className?: string
}

export default function Twemoji({ children, className }: TwemojiProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (ref.current) {
      twemoji.parse(ref.current, {
        folder: 'svg',
        ext: '.svg',
      })
    }
  })

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  )
}
