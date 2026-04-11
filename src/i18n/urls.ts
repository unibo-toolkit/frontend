import { routing, type Locale } from './routing'

export const SITE_URL = 'https://uniplanner.it'

export function localeUrl(locale: Locale, path: string = ''): string {
  const cleanPath = path === '/' ? '' : path
  return locale === routing.defaultLocale
    ? `${SITE_URL}${cleanPath}`
    : `${SITE_URL}/${locale}${cleanPath}`
}

export function alternateLanguages(path: string = ''): Record<string, string> {
  const entries = routing.locales.map(
    (locale) => [locale, localeUrl(locale, path)] as const,
  )
  return {
    ...Object.fromEntries(entries),
    'x-default': localeUrl(routing.defaultLocale, path),
  }
}
