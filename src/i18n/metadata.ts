import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing, type Locale } from './routing'
import { localeUrl, alternateLanguages, SITE_URL } from './urls'

const OG_LOCALE: Record<Locale, string> = {
  it: 'it_IT',
  en: 'en_US',
}

interface BuildMetadataOptions {
  locale: Locale
  namespace: string
  path?: string
  noindex?: boolean
  titleOverride?: string
  descriptionOverride?: string
}

export async function buildPageMetadata({
  locale,
  namespace,
  path = '',
  noindex = false,
  titleOverride,
  descriptionOverride,
}: BuildMetadataOptions): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace })

  const title = titleOverride ?? t('title')
  const description = descriptionOverride ?? t('description')

  let keywords: string[] | undefined
  if (t.has('keywords')) {
    const raw = t.raw('keywords')
    if (Array.isArray(raw)) keywords = raw as string[]
  }

  const canonical = localeUrl(locale, path)

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: alternateLanguages(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'UniPlanner',
      type: 'website',
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
  }
}
