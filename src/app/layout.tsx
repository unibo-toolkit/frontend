import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import Providers from './providers'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'UniPlanner — Your university schedule, always in sync',
    template: '%s | UniPlanner',
  },
  description: 'Generate a personal calendar link for your University of Bologna schedule. Works with Apple Calendar, Google Calendar, and Outlook — updates automatically.',
  keywords: ['university schedule', 'UniBO', 'calendar sync', 'timetable', 'University of Bologna', 'student calendar', 'ICS calendar', 'orario universitario'],
  metadataBase: new URL('https://uniplanner.it'),
  alternates: {
    canonical: 'https://uniplanner.it',
    languages: {
      'en': 'https://uniplanner.it',
      'it': 'https://uniplanner.it',
    },
  },
  openGraph: {
    title: 'UniPlanner — Your university schedule, always in sync',
    description: 'Generate a personal calendar link in 30 seconds. Works with Apple Calendar, Google Calendar, and Outlook.',
    url: 'https://uniplanner.it',
    siteName: 'UniPlanner',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['it_IT'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniPlanner — Your university schedule, always in sync',
    description: 'Generate a personal calendar link in 30 seconds. Works with Apple Calendar, Google Calendar, and Outlook.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value || 'dark'
  const hasAuth = !!(cookieStore.get('access_token')?.value || cookieStore.get('refresh_token')?.value)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'UniPlanner',
    url: 'https://uniplanner.it',
    description: 'Generate a personal calendar link for your University of Bologna schedule. Works with Apple Calendar, Google Calendar, and Outlook.',
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    inLanguage: ['en', 'it'],
  }

  return (
    <html lang={locale} data-theme={theme} data-auth={hasAuth ? 'true' : 'false'} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.variable}>
        <NextIntlClientProvider messages={messages}>
          <Providers hasAuth={hasAuth}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
