import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { buildPageMetadata } from '@/i18n/metadata'

interface Props {
  params: Promise<{ locale: string; slug: string }>
  children: React.ReactNode
}

async function fetchCalendar(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://uniplanner.it'
  try {
    const res = await fetch(`${apiUrl}/api/v1/calendars/public/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as { name: string; total_events?: number }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) return {}

  const calendar = await fetchCalendar(slug)

  if (!calendar) {
    const tErr = await getTranslations({ locale, namespace: 'errors' })
    return buildPageMetadata({
      locale,
      namespace: 'errors',
      path: `/cal/${slug}`,
      noindex: true,
      titleOverride: tErr('calendarNotFound'),
      descriptionOverride: tErr('calendarNotFoundDesc'),
    })
  }

  const t = await getTranslations({ locale, namespace: 'meta.calendar' })
  const eventCount = calendar.total_events ?? 0
  const title = t('titleTemplate', { name: calendar.name })
  const description = t('descriptionTemplate', {
    name: calendar.name,
    events: eventCount,
  })

  return buildPageMetadata({
    locale: locale as Locale,
    namespace: 'meta.calendar',
    path: `/cal/${slug}`,
    titleOverride: title,
    descriptionOverride: description,
  })
}

export default function CalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
