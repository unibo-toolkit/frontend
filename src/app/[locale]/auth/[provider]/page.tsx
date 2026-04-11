import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { hasLocale } from 'next-intl'

export default async function AuthProviderPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
  redirect({ href: '/auth', locale: safeLocale })
}
