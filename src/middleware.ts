import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  const hasAuth = !!(accessToken || refreshToken)

  if (pathname === '/auth' && hasAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (protectedPaths.some((path) => pathname.startsWith(path)) && !hasAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth'],
}
