import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { buildPageMetadata } from '@/i18n/metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  return buildPageMetadata({ locale, namespace: 'meta.create', path: '/create' })
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
