import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

async function fetchCalendar(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://uniplanner.it'
  try {
    const res = await fetch(`${apiUrl}/api/v1/calendars/public/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return await res.json() as { name: string; total_events?: number }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const calendar = await fetchCalendar(slug)

  if (!calendar) {
    return {
      title: 'Calendar not found',
      description: 'This calendar does not exist or has been deleted.',
      robots: { index: false, follow: false },
    }
  }

  const title = `${calendar.name} — UniPlanner`
  const eventCount = calendar.total_events ?? 0
  const description = eventCount > 0
    ? `${calendar.name} — ${eventCount} events. Add to Apple Calendar, Google Calendar, or Outlook.`
    : `${calendar.name} — Shared via UniPlanner. Add to your favorite calendar app.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://uniplanner.it/cal/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://uniplanner.it/cal/${slug}`,
    },
  }
}

export default function CalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
