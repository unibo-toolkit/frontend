import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { clearAuthCookies } from '@/lib/cookies'
import { logError } from '@/lib/logger'
import { buildForwardedHeaders } from '@/lib/forwardHeaders'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (refreshToken) {
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || ''
      await fetch(`${authServiceUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: buildForwardedHeaders(request, { 'content-type': 'application/json' }),
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    } catch (error) {
      logError('Logout error', { error: String(error) })
    }
  }

  clearAuthCookies(cookieStore)
  return NextResponse.json({ success: true })
}
