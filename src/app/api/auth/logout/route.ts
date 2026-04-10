import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearAuthCookies } from '@/lib/cookies'
import { logError } from '@/lib/logger'

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (refreshToken) {
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || ''
      await fetch(`${authServiceUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    } catch (error) {
      logError('Logout error', { error: String(error) })
    }
  }

  clearAuthCookies(cookieStore)
  return NextResponse.json({ success: true })
}
