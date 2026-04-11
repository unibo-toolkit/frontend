import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const PROTECTED_PATHS = ['/dashboard']

function getLocaleFromPathname(pathname: string): string | null {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale
    }
  }
  return null
}

function stripLocale(pathname: string): string {
  const locale = getLocaleFromPathname(pathname)
  if (!locale) return pathname
  const stripped = pathname.slice(locale.length + 1)
  return stripped === '' ? '/' : stripped
}

function buildLocalizedRedirect(
  request: NextRequest,
  appPath: string,
  searchParams?: Record<string, string>,
): NextResponse {
  const url = request.nextUrl.clone()
  const currentLocale = getLocaleFromPathname(request.nextUrl.pathname)
  const prefix = currentLocale ? `/${currentLocale}` : ''
  const cleanPath = appPath === '/' ? '' : appPath
  url.pathname = `${prefix}${cleanPath}` || '/'
  if (searchParams) {
    url.search = ''
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value)
    }
  }
  return NextResponse.redirect(url)
}

export default function middleware(request: NextRequest) {
  const appPath = stripLocale(request.nextUrl.pathname)

  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  const hasAuth = !!(accessToken || refreshToken)

  if (appPath === '/auth' && hasAuth) {
    return buildLocalizedRedirect(request, '/dashboard')
  }

  if (PROTECTED_PATHS.some((p) => appPath.startsWith(p)) && !hasAuth) {
    return buildLocalizedRedirect(request, '/auth', { redirect: appPath })
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
