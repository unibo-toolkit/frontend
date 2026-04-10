import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'UniPlanner — Shared calendar'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function fetchCalendar(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://uniplanner.it'
  try {
    const res = await fetch(`${apiUrl}/api/v1/calendars/public/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return await res.json() as { name: string; total_events?: number; courses?: Array<{ subjects?: Array<unknown> }> }
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: { slug: string } }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uniplanner.it'
  const [calendar, logoData] = await Promise.all([
    fetchCalendar(params.slug),
    fetch(`${siteUrl}/logo.png`).then(r => r.arrayBuffer()).catch(() => null),
  ])
  const title = calendar?.name || 'University calendar'
  const eventCount = calendar?.total_events ?? 0
  const subjectCount = calendar?.courses?.flatMap(c => c.subjects || []).length ?? 0

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
          <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.1, maxWidth: 900 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, color: '#9c9c9c', display: 'flex', gap: 24 }}>
            {subjectCount > 0 && <span>{subjectCount} subjects</span>}
            {eventCount > 0 && <span>· {eventCount} events</span>}
            {subjectCount === 0 && eventCount === 0 && <span>Shared via UniPlanner</span>}
          </div>
        </div>
        <div style={{ fontSize: 24, color: '#585858' }}>
          Add to Apple Calendar, Google Calendar, Outlook
        </div>
      </div>
    ),
    { ...size }
  )
}
