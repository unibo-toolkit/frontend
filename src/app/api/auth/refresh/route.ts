import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { setAuthCookies, clearAuthCookies, COOKIE_REFRESH_TOKEN } from '@/lib/cookies'
import { logError } from '@/lib/logger'
import { buildForwardedHeaders } from '@/lib/forwardHeaders'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${authServiceUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: buildForwardedHeaders(request, { 'content-type': 'application/json' }),
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      const body = await response.text()
      logError('Auth refresh failed', { status: response.status, body: body.substring(0, 200) })

      if (response.status === 401 || response.status === 403) {
        clearAuthCookies(cookieStore)
      }
      return NextResponse.json({ error: 'Refresh failed' }, { status: response.status })
    }

    const json = await response.json()

    if (
      !json.access_token ||
      !json.refresh_token ||
      typeof json.access_token !== 'string' ||
      typeof json.refresh_token !== 'string' ||
      json.access_token.trim().length === 0 ||
      json.refresh_token.trim().length === 0
    ) {
      logError('Auth refresh invalid response', { keys: Object.keys(json) })
      return NextResponse.json({ error: 'Invalid response' }, { status: 502 })
    }

    setAuthCookies(cookieStore, json.access_token, json.refresh_token)
    return NextResponse.json({ success: true })
  } catch (error) {
    logError('Token refresh network error', { error: String(error) })
    return NextResponse.json({ error: 'Network error' }, { status: 503 })
  }
}
