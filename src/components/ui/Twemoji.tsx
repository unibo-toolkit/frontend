'use client'

import { useRef, useEffect, type ReactNode } from 'react'

const CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg'

const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}{2}/gu

function parseEmoji(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  for (const node of nodes) {
    if (!EMOJI_RE.test(node.data)) continue
    EMOJI_RE.lastIndex = 0

    const frag = document.createDocumentFragment()
    let last = 0

    for (const match of node.data.matchAll(EMOJI_RE)) {
      const idx = match.index!
      if (idx > last) frag.appendChild(document.createTextNode(node.data.slice(last, idx)))

      const cp = [...match[0]].map(c => c.codePointAt(0)!.toString(16)).join('-')
      const img = document.createElement('img')
      img.className = 'emoji'
      img.alt = match[0]
      img.src = `${CDN}/${cp}.svg`
      img.draggable = false
      frag.appendChild(img)
      last = idx + match[0].length
    }

    if (last < node.data.length) frag.appendChild(document.createTextNode(node.data.slice(last)))
    node.parentNode?.replaceChild(frag, node)
  }
}

interface TwemojiProps {
  children: ReactNode
  className?: string
}

export default function Twemoji({ children, className }: TwemojiProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (ref.current) parseEmoji(ref.current)
  })

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  )
}
