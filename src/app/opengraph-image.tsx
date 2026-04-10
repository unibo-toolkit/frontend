import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'UniPlanner — Your university schedule, always in sync'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uniplanner.it'
  const logoData = await fetch(`${siteUrl}/logo.png`)
    .then(r => r.arrayBuffer())
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoData as unknown as string} width={64} height={64} alt="UniPlanner" />
          )}
          UniPlanner
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 960 }}>
            Your university schedule, always in sync
          </div>
          <div style={{ fontSize: 32, color: '#c4c4c4', maxWidth: 960, lineHeight: 1.3 }}>
            Generate a personal calendar link in 30 seconds.
          </div>
        </div>
        <div style={{ fontSize: 26, color: '#7a7a7a' }}>
          Apple Calendar · Google Calendar · Outlook
        </div>
      </div>
    ),
    { ...size }
  )
}
