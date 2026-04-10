import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setAuthCookies } from '@/lib/cookies'
import { logError } from '@/lib/logger'

function detectProvider(params: URLSearchParams): string | null {
  const explicit = params.get('provider')
  if (explicit) return explicit

  const iss = params.get('iss') || ''
  if (iss.includes('accounts.google.com')) return 'google'
  if (iss.includes('appleid.apple.com')) return 'apple'

  const idToken = params.get('id_token')
  if (idToken) return 'apple'

  return null
}

function sanitizeRedirect(redirect: string | null): string {
  if (!redirect || !redirect.startsWith('/')) return '/dashboard'
  if (redirect.startsWith('//')) return '/dashboard'
  return redirect
}

function getBaseUrl(request: NextRequest): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) return siteUrl.replace(/\/$/, '')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`

  const host = request.headers.get('host')
  if (host) {
    const proto = request.nextUrl.protocol.replace(':', '') || 'https'
    return `${proto}://${host}`
  }

  return new URL(request.url).origin
}

async function handleCallback(
  request: NextRequest,
  params: URLSearchParams,
): Promise<NextResponse> {
  const baseUrl = getBaseUrl(request)
  const code = params.get('code')
  const provider = detectProvider(params)
  const state = params.get('state')
  const userJson = params.get('user')

  const redirectCookie = request.cookies.get('auth_redirect')?.value
  const redirect = sanitizeRedirect(
    redirectCookie ? decodeURIComponent(redirectCookie) : params.get('redirect'),
  )

  if (!code || !provider) {
    return NextResponse.redirect(new URL('/auth/error?reason=server', baseUrl))
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
        user: userJson || undefined,
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
      return NextResponse.redirect(new URL('/auth/error?reason=server', baseUrl))
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
      return NextResponse.redirect(new URL('/auth/error?reason=server', baseUrl))
    }

    const cookieStore = await cookies()
    setAuthCookies(cookieStore, access_token, refresh_token)
    cookieStore.delete('auth_redirect')

    return NextResponse.redirect(new URL(redirect, baseUrl))
  } catch (error) {
    logError('Auth callback error', { error: String(error) })
    return NextResponse.redirect(new URL('/auth/error?reason=server', baseUrl))
  }
}

export async function GET(request: NextRequest) {
  return handleCallback(request, request.nextUrl.searchParams)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params = new URLSearchParams()
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') params.append(key, value)
    }
    return handleCallback(request, params)
  } catch (error) {
    logError('Auth callback POST parse error', { error: String(error) })
    const baseUrl = getBaseUrl(request)
    return NextResponse.redirect(new URL('/auth/error?reason=server', baseUrl))
  }
}
