import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setAuthCookies } from '@/lib/cookies'
import { logError } from '@/lib/logger'

function detectProvider(searchParams: URLSearchParams): string | null {
  const explicit = searchParams.get('provider')
  if (explicit) return explicit

  const iss = searchParams.get('iss') || ''
  if (iss.includes('accounts.google.com')) return 'google'
  if (iss.includes('appleid.apple.com')) return 'apple'

  return null
}

function sanitizeRedirect(redirect: string | null): string {
  if (!redirect || !redirect.startsWith('/')) return '/dashboard'
  if (redirect.startsWith('//')) return '/dashboard'
  return redirect
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const provider = detectProvider(searchParams)
  const redirectCookie = request.cookies.get('auth_redirect')?.value
  const redirect = sanitizeRedirect(
    redirectCookie ? decodeURIComponent(redirectCookie) : searchParams.get('redirect')
  )
  const state = searchParams.get('state')

  if (!code || !provider) {
    return NextResponse.redirect(new URL('/auth/error?reason=server', request.url))
  }

  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${authServiceUrl}/api/v1/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        code,
        state: state || undefined,
        device_name: request.headers.get('user-agent') || 'Unknown',
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      logError('Auth callback exchange failed', {
        status: response.status,
        body: body.substring(0, 500),
        provider,
      })
      return NextResponse.redirect(new URL('/auth/error?reason=server', request.url))
    }

    const json = await response.json()
    const { access_token, refresh_token } = json

    if (
      !access_token ||
      !refresh_token ||
      typeof access_token !== 'string' ||
      typeof refresh_token !== 'string' ||
      access_token.trim().length === 0 ||
      refresh_token.trim().length === 0
    ) {
      logError('Auth callback invalid tokens', { hasAccess: !!access_token, hasRefresh: !!refresh_token })
      return NextResponse.redirect(new URL('/auth/error?reason=server', request.url))
    }

    const cookieStore = await cookies()
    setAuthCookies(cookieStore, access_token, refresh_token)
    cookieStore.delete('auth_redirect')

    return NextResponse.redirect(new URL(redirect, request.url))
  } catch (error) {
    logError('Auth callback error', { error: String(error) })
    return NextResponse.redirect(new URL('/auth/error?reason=server', request.url))
  }
}
