import { Inter } from 'next/font/google'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale, getMessages, getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Providers from '../providers'
import { routing, type Locale } from '@/i18n/routing'
import { localeUrl } from '@/i18n/urls'
import { buildPageMetadata } from '@/i18n/metadata'
import '@/styles/globals.css'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  return buildPageMetadata({ locale, namespace: 'meta.landing', path: '' })
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)

  const messages = await getMessages()
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value || 'dark'
  const hasAuth = !!(
    cookieStore.get('access_token')?.value ||
    cookieStore.get('refresh_token')?.value
  )

  const t = await getTranslations({ locale, namespace: 'meta.landing' })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'UniPlanner',
    url: localeUrl(locale as Locale),
    description: t('description'),
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Any',
    inLanguage: locale,
    availableLanguage: routing.locales,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  }

  return (
    <html
      lang={locale}
      data-theme={theme}
      data-auth={hasAuth ? 'true' : 'false'}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.variable}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers hasAuth={hasAuth}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
