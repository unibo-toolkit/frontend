'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { ArrowRight, ArrowDown } from '@/components/ui/icons'
import { usePublicStats } from '@/hooks/usePublicStats'
import styles from './page.module.css'

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${Math.floor(n / 1_000_000)}kk`
  if (n >= 10_000) return `${Math.floor(n / 1_000)}k`
  return n.toLocaleString()
}

function heroSrc(theme: 'dark' | 'light', locale: Locale): string {
  const suffix = locale === 'it' ? '-it' : ''
  return theme === 'light'
    ? `/images/hero-calendar-light${suffix}.webp`
    : `/images/hero-calendar${suffix}.webp`
}

function cardSrc(name: string, theme: 'dark' | 'light'): string {
  const variant = theme === 'light' ? `${name}-light` : name
  return `/images/${variant}.webp`
}

export default function LandingPageClient({ initialTheme, locale }: { initialTheme: 'dark' | 'light'; locale: Locale }) {
  const t = useTranslations()
  const { data: stats } = usePublicStats()
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme)
  const [heroLoaded, setHeroLoaded] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme')
      if (current === 'dark' || current === 'light') {
        setTheme(prev => prev === current ? prev : current)
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setHeroLoaded(true), 4000)
    return () => clearTimeout(timeout)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
    <div
      key="pageLoader"
      className={styles.pageLoader}
      style={{ display: heroLoaded ? 'none' : 'flex' }}
    >
      <div className={styles.pageLoaderSpinner} />
    </div>
    <div
      key="page"
      className={styles.page}
      style={{ opacity: heroLoaded ? 1 : 0, pointerEvents: heroLoaded ? 'auto' : 'none' }}
    >
      <Nav />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>{t('hero.badge')}</div>
            <h1 className={styles.heroTitle}>{t('hero.title')}</h1>
            <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
            <div className={styles.heroButtons}>
              <Link href="/create">
                <Button variant="primary" icon={<ArrowRight />}>
                  {t('nav.create')}
                </Button>
              </Link>
              <Button variant="ghost" onClick={() => scrollTo('how-it-works')} icon={<ArrowDown />}>
                {t('hero.seeHow')}
              </Button>
            </div>
            <p className={styles.heroNote}>{t('hero.noAccount')}</p>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.heroBadgeSync}>
              <img src="/icons/sync-badge.svg" alt="" width={18} height={12} />
              <span>
                {stats
                  ? t('hero.syncBadge', { calendars: formatCount(stats.active_calendars_count), events: formatCount(stats.total_events_count) })
                  : t('hero.syncBadgePlaceholder')
                }
              </span>
            </div>
            <div className={styles.heroCalendarWrap}>
              <img
                src={heroSrc(theme, locale)}
                alt="Calendar preview"
                width={849}
                height={732}
                className={styles.heroCalendarImg}
                onLoad={() => setHeroLoaded(true)}
                onError={() => setHeroLoaded(true)}
              />
            </div>
          </div>
          <img src="/images/hero-glow.svg" alt="" className={styles.heroGlow} loading="eager" />
        </div>
      </section>

      <HowItWorks t={t} theme={theme} />

      <section id="features" className={styles.features}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>{t('features.title')}</h2>
          <p className={styles.featuresSubtitle}>{t('features.subtitle')}</p>
        </div>
        <div className={styles.featureGrid}>
          <div className={styles.featureRow}>
            <FeatureItem icon="/icons/sync.svg" title={t('features.autoUpdate')} desc={t('features.autoUpdateDesc')} />
            <FeatureItem icon="/icons/filter.svg" title={t('features.filter')} desc={t('features.filterDesc')} />
          </div>
          <div className={styles.featureRow}>
            <FeatureItem icon="/icons/calendar-any.svg" title={t('features.anyCalendar')} desc={t('features.anyCalendarDesc')} />
            <FeatureItem icon="/icons/person.svg" title={t('features.noAccount')} desc={t('features.noAccountDesc')} />
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>{t('cta.title')}</h2>
          <p className={styles.ctaSubtitle}>{t('cta.subtitle')}</p>
        </div>
        <div className={styles.ctaButtons}>
          <Link href="/create">
            <Button variant="primary" icon={<ArrowRight />}>{t('nav.create')}</Button>
          </Link>
          <Link href="/auth" className={`${styles.ctaLink} ${styles.showGuest}`}>{t('cta.signInLink')}</Link>
        </div>
      </section>

      <Footer />
    </div>
    </>
  )
}

function HowItWorks({ t, theme }: { t: ReturnType<typeof useTranslations>; theme: 'dark' | 'light' }) {
  const cardsRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)
  const [isTablet, setIsTablet] = useState(false)
  const animRef = useRef<number | null>(null)
  const INTERVAL = 6000

  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth <= 1440 && window.innerWidth > 767)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isTablet || !cardsRef.current) return
    const el = cardsRef.current
    const cards = Array.from(el.children) as HTMLElement[]
    const totalCards = cards.length
    if (!totalCards) return

    const updateOverlay = () => {
      if (!overlayRef.current) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      const progress = el.scrollLeft / maxScroll
      overlayRef.current.style.boxShadow =
        `inset -${80 * (1 - progress)}px 0 60px -30px var(--bg-main), inset ${80 * progress}px 0 60px -30px var(--bg-main)`
    }

    el.addEventListener('scroll', updateOverlay, { passive: true })
    updateOverlay()

    const getStepWidth = () => {
      if (cards.length < 2) return cards[0].offsetWidth
      return cards[1].offsetLeft - cards[0].offsetLeft
    }

    const getMaxScroll = () => el.scrollWidth - el.clientWidth

    const getStepCount = () => {
      const maxScroll = getMaxScroll()
      if (maxScroll <= 0) return 1
      const sw = getStepWidth()
      return Math.min(el.children.length, Math.ceil(maxScroll / sw) + 1)
    }

    const getSnapPositions = () => {
      const steps = getStepCount()
      const sw = getStepWidth()
      const maxScroll = getMaxScroll()
      return Array.from({ length: steps }, (_, i) => Math.min(i * sw, maxScroll))
    }

    const scrollToStep = (step: number) => {
      const snaps = getSnapPositions()
      if (snaps.length <= 1) return
      el.scrollTo({ left: snaps[step] ?? snaps[snaps.length - 1], behavior: 'smooth' })
    }

    const stepFromScroll = () => {
      const snaps = getSnapPositions()
      const L = el.scrollLeft
      return snaps.reduce((best, pos, i) =>
        Math.abs(L - pos) < Math.abs(L - snaps[best]) ? i : best, 0)
    }

    const buildBars = () => {
      if (!dotsRef.current) return
      const count = getStepCount()
      if (dotsRef.current.children.length === count) return
      while (dotsRef.current.firstChild) {
        dotsRef.current.removeChild(dotsRef.current.firstChild)
      }
      for (let i = 0; i < count; i++) {
        const bar = document.createElement('div')
        bar.className = styles.progressBar
        const inner = document.createElement('div')
        inner.className = styles.progressBarFill
        bar.appendChild(inner)
        dotsRef.current.appendChild(bar)
      }
    }

    const setBarFills = (active: number, pct: number) => {
      if (!dotsRef.current) return
      for (let i = 0; i < dotsRef.current.children.length; i++) {
        const fill = (dotsRef.current.children[i] as HTMLElement).firstElementChild as HTMLElement
        if (!fill) continue
        fill.style.width = i < active ? '100%' : i === active ? `${pct}%` : '0%'
      }
    }

    buildBars()

    let current = stepFromScroll()
    let startTime = Date.now()
    let paused = false

    const tick = () => {
      if (paused) return
      const steps = getStepCount()
      buildBars()
      if (current >= steps) current = 0
      const pct = Math.min((Date.now() - startTime) / INTERVAL * 100, 100)
      setBarFills(current, pct)
      if (pct >= 100) {
        current = (current + 1) % steps
        scrollToStep(current)
        startTime = Date.now()
      }
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)

    const onResize = () => { buildBars() }
    window.addEventListener('resize', onResize)

    let resumeTimeout: ReturnType<typeof setTimeout>
    let autoScrolling = false

    const origScrollTo = el.scrollTo.bind(el)
    el.scrollTo = (...args: any[]) => {
      autoScrolling = true
      origScrollTo(...args)
      setTimeout(() => { autoScrolling = false }, 800)
    }

    const updateBarsFromScroll = () => {
      const snaps = getSnapPositions()
      if (snaps.length <= 1) return
      const L = el.scrollLeft
      let step = snaps.length - 1
      let pct = 100
      for (let i = 0; i < snaps.length - 1; i++) {
        if (L <= snaps[i + 1]) {
          const segLen = snaps[i + 1] - snaps[i]
          step = i
          pct = segLen > 0 ? (L - snaps[i]) / segLen * 100 : 0
          break
        }
      }
      setBarFills(step, pct)
    }

    const onScroll = () => {
      if (autoScrolling) return
      paused = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      clearTimeout(resumeTimeout)
      updateBarsFromScroll()
    }

    const onScrollEnd = () => {
      if (autoScrolling) return
      current = stepFromScroll()
      setBarFills(current, 0)
      resumeTimeout = setTimeout(() => {
        paused = false
        startTime = Date.now()
        animRef.current = requestAnimationFrame(tick)
      }, 2000)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('scrollend', onScrollEnd, { passive: true })

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      clearTimeout(resumeTimeout)
      el.scrollTo = origScrollTo
      window.removeEventListener('resize', onResize)
      el.removeEventListener('scroll', updateOverlay)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scrollend', onScrollEnd)
    }
  }, [isTablet])

  return (
      <section id="how-it-works" className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>{t('howItWorks.title')}</h2>
        <div className={styles.cardsWrapper}>
        <div className={styles.cards} ref={cardsRef}>
          <div className={`${styles.card} ${styles.cardRed}`}>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconRed}`}>
                  <img src="/icons/search.svg" alt="" className={`${styles.cardIconImg} ${styles.imgDark}`} />
                  <img src="/icons/search-light.svg" alt="" className={`${styles.cardIconImg} ${styles.imgLight}`} />
                </div>
                <h3 className={styles.cardTitle}>{t('howItWorks.step1Title')}</h3>
              </div>
              <p className={styles.cardDesc}>{t('howItWorks.step1Desc')}</p>
            </div>
            <div className={`${styles.cardImageWrap} ${styles.cardImageWrapRed}`}>
              <img
                src={cardSrc('card-course', theme)}
                alt=""
                width={580}
                height={749}
                className={`${styles.cardImage} ${styles.cardImageShadowRed}`}
              />
            </div>
          </div>
          <div className={`${styles.card} ${styles.cardBlue}`}>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
                  <img src="/icons/link.svg" alt="" className={`${styles.cardIconImg} ${styles.imgDark}`} />
                  <img src="/icons/link-light.svg" alt="" className={`${styles.cardIconImg} ${styles.imgLight}`} />
                </div>
                <h3 className={styles.cardTitle}>{t('howItWorks.step2Title')}</h3>
              </div>
              <p className={styles.cardDesc}>{t('howItWorks.step2Desc')}</p>
            </div>
            <div className={styles.cardImageWrap}>
              <img
                src={cardSrc('card-link', theme)}
                alt=""
                width={580}
                height={749}
                className={styles.cardImage}
              />
            </div>
          </div>
          <div className={`${styles.card} ${styles.cardPurple}`}>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconPurple}`}>
                  <img src="/icons/calendar-card.svg" alt="" className={`${styles.cardIconImg} ${styles.imgDark}`} />
                  <img src="/icons/calendar-card-light.svg" alt="" className={`${styles.cardIconImg} ${styles.imgLight}`} />
                </div>
                <h3 className={styles.cardTitle}>{t('howItWorks.step3Title')}</h3>
              </div>
              <p className={styles.cardDesc}>{t('howItWorks.step3Desc')}</p>
            </div>
            <div className={`${styles.cardImageWrap} ${styles.cardImageWrapPurple}`}>
              <img
                src={cardSrc('card-sync', theme)}
                alt=""
                width={580}
                height={749}
                className={`${styles.cardImage} ${styles.cardImageShadowPurple}`}
              />
            </div>
          </div>
        </div>
        <div className={styles.cardsOverlay} ref={overlayRef} />
        </div>
        {isTablet && <div className={styles.progressDots} ref={dotsRef} />}
      </section>
  )
}

function FeatureItem({ icon, title, desc, note }: { icon: string; title: string; desc: string; note?: string }) {
  return (
    <div className={styles.featureItem}>
      <div className={styles.featureIcon}>
        <img src={icon} alt="" className={styles.featureIconImg} />
      </div>
      <p className={styles.featureText}>
        <strong>{title}</strong> {desc}
        {note && <span className={styles.featureNote}> {note}</span>}
      </p>
    </div>
  )
}

