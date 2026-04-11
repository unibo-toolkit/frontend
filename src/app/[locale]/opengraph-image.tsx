import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export const alt = 'UniPlanner'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { locale: string } }) {
  const locale = hasLocale(routing.locales, params.locale)
    ? params.locale
    : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tFooter = await getTranslations({ locale, namespace: 'create.created' })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uniplanner.it'
  const logoData = await fetch(`${siteUrl}/logo.png`)
    .then((r) => r.arrayBuffer())
    .catch(() => null)

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
            <img src={logoData as unknown as string} width={64} height={64} alt="UniPlanner" />
          )}
          UniPlanner
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 960 }}>
            {t('title')}
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: '#c4c4c4', maxWidth: 960, lineHeight: 1.3 }}>
            {t('subtitle')}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#7a7a7a' }}>
          {`${tFooter('appleCalendar')} · ${tFooter('googleCalendar')} · Outlook`}
        </div>
      </div>
    ),
    { ...size },
  )
}
