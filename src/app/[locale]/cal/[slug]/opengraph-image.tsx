import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { headers } from 'next/headers'
import { routing } from '@/i18n/routing'
import { buildForwardedHeaders } from '@/lib/forwardHeaders'

export const alt = 'UniPlanner — Shared calendar'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function fetchCalendar(slug: string, reqHeaders: Headers) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://uniplanner.it'
  try {
    const res = await fetch(`${apiUrl}/api/v1/calendars/public/${slug}`, {
      next: { revalidate: 300 },
      headers: buildForwardedHeaders(reqHeaders),
    })
    if (!res.ok) return null
    return (await res.json()) as {
      name: string
      total_events?: number
      courses?: Array<{ subjects?: Array<unknown> }>
    }
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: { locale: string; slug: string } }) {
  const locale = hasLocale(routing.locales, params.locale)
    ? params.locale
    : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'meta.calendar' })
  const tCreate = await getTranslations({ locale, namespace: 'create' })
  const tDashStats = await getTranslations({ locale, namespace: 'dashboard.stats' })
  const tCreated = await getTranslations({ locale, namespace: 'create.created' })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uniplanner.it'
  const reqHeaders = await headers()
  const [calendar, logoData] = await Promise.all([
    fetchCalendar(params.slug, reqHeaders),
    fetch(`${siteUrl}/logo.png`).then((r) => r.arrayBuffer()).catch(() => null),
  ])
  const title = calendar?.name || t('fallbackName')
  const eventCount = calendar?.total_events ?? 0
  const subjectCount = calendar?.courses?.flatMap((c) => c.subjects || []).length ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0040 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 36, fontWeight: 600 }}>
          {logoData && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoData as unknown as string} width={64} height={64} alt="UniPlanner" />
          )}
          UniPlanner
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 600, lineHeight: 1.1, maxWidth: 900 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, color: '#9c9c9c', display: 'flex', gap: 24 }}>
            {subjectCount > 0 && (
              <span style={{ display: 'flex' }}>
                {`${subjectCount} ${tCreate('subjects').toLowerCase()}`}
              </span>
            )}
            {eventCount > 0 && (
              <span style={{ display: 'flex' }}>
                {`· ${eventCount} ${tDashStats('events')}`}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#585858' }}>
          {`${tCreated('appleCalendar')} · ${tCreated('googleCalendar')} · Outlook`}
        </div>
      </div>
    ),
    { ...size },
  )
}
