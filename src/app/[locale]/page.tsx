import { cookies } from 'next/headers'
import { hasLocale } from 'next-intl'
import { routing, type Locale } from '@/i18n/routing'
import LandingPageClient from './LandingPageClient'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value
  const initialTheme: 'dark' | 'light' = themeCookie === 'light' ? 'light' : 'dark'
  return <LandingPageClient initialTheme={initialTheme} locale={locale} />
}
