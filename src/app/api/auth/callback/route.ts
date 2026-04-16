import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setAuthCookies } from '@/lib/cookies'
import { logError, logInfo } from '@/lib/logger'
import { buildForwardedHeaders } from '@/lib/forwardHeaders'

function detectProvider(
  params: URLSearchParams,
  request: NextRequest,
): string | null {
  const explicit = params.get('provider')
  if (explicit) return explicit

  const iss = params.get('iss') || ''
  if (iss.includes('accounts.google.com')) return 'google'
  if (iss.includes('appleid.apple.com')) return 'apple'

  const idToken = params.get('id_token')
  if (idToken) return 'apple'

  const providerCookie = request.cookies.get('auth_provider')?.value
  if (providerCookie === 'google' || providerCookie === 'apple') return providerCookie

  const referer = request.headers.get('referer') || ''
  if (referer.includes('appleid.apple.com')) return 'apple'
  if (referer.includes('accounts.google.com')) return 'google'

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
  method: string,
): Promise<NextResponse> {
  const baseUrl = getBaseUrl(request)
  const code = params.get('code')
  const provider = detectProvider(params, request)
  const state = params.get('state')
  const userJson = params.get('user')
  const idToken = params.get('id_token')
  const paramKeys = Array.from(new Set(Array.from(params.keys())))

  logInfo('Auth callback received', {
    method,
    paramKeys,
    hasCode: !!code,
    hasState: !!state,
    hasUser: !!userJson,
    hasIdToken: !!idToken,
    detectedProvider: provider,
    iss: params.get('iss') || null,
    baseUrl,
    hasAuthRedirectCookie: !!request.cookies.get('auth_redirect')?.value,
  })

  const redirectCookie = request.cookies.get('auth_redirect')?.value
  const redirect = sanitizeRedirect(
    redirectCookie ? decodeURIComponent(redirectCookie) : params.get('redirect'),
  )

  if (!code || !provider) {
    logError('Auth callback missing code or provider', {
      method,
      hasCode: !!code,
      provider,
      paramKeys,
    })
    return NextResponse.redirect(new URL('/auth/error?reason=missing_params', baseUrl), 303)
  }

  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || ''
    if (!authServiceUrl) {
      logError('Auth callback missing AUTH_SERVICE_URL env', { provider })
      return NextResponse.redirect(new URL('/auth/error?reason=config', baseUrl), 303)
    }

    logInfo('Auth callback calling exchange', { provider, authServiceUrl, codeLen: code.length })

    const response = await fetch(`${authServiceUrl}/api/v1/auth/exchange`, {
      method: 'POST',
      headers: buildForwardedHeaders(request, { 'content-type': 'application/json' }),
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
        statusText: response.statusText,
        body: body.substring(0, 1000),
        provider,
        authServiceUrl,
      })
      return NextResponse.redirect(new URL(`/auth/error?reason=exchange_${response.status}`, baseUrl), 303)
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
      logError('Auth callback invalid tokens', {
        hasAccess: !!access_token,
        hasRefresh: !!refresh_token,
        responseKeys: Object.keys(json || {}),
      })
      return NextResponse.redirect(new URL('/auth/error?reason=invalid_tokens', baseUrl), 303)
    }

    const cookieStore = await cookies()
    setAuthCookies(cookieStore, access_token, refresh_token)
    cookieStore.delete('auth_redirect')
    cookieStore.delete('auth_provider')

    logInfo('Auth callback success', { provider, redirect })
    return NextResponse.redirect(new URL(redirect, baseUrl), 303)
  } catch (error) {
    logError('Auth callback error', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      provider,
    })
    return NextResponse.redirect(new URL('/auth/error?reason=exception', baseUrl), 303)
  }
}

export async function GET(request: NextRequest) {
  return handleCallback(request, request.nextUrl.searchParams, 'GET')
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  logInfo('Auth callback POST entry', {
    contentType,
    url: request.url,
    hasForwardedHost: !!request.headers.get('x-forwarded-host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    host: request.headers.get('host'),
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin'),
  })

  let rawBody = ''
  try {
    rawBody = await request.clone().text()
    logInfo('Auth callback POST raw body', {
      length: rawBody.length,
      preview: rawBody.substring(0, 500).replace(/code=[^&]+/g, 'code=***').replace(/id_token=[^&]+/g, 'id_token=***'),
    })
  } catch (error) {
    logError('Auth callback POST raw body read failed', { error: String(error) })
  }

  try {
    const params = new URLSearchParams()
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const parsed = new URLSearchParams(rawBody)
      for (const [key, value] of parsed.entries()) params.append(key, value)
    } else {
      const formData = await request.formData()
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') params.append(key, value)
      }
    }
    return handleCallback(request, params, 'POST')
  } catch (error) {
    logError('Auth callback POST parse error', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      contentType,
      rawBodyLength: rawBody.length,
    })
    const baseUrl = getBaseUrl(request)
    return NextResponse.redirect(new URL('/auth/error?reason=post_parse', baseUrl), 303)
  }
}
