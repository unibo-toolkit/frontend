import { cookies } from 'next/headers'

export const COOKIE_ACCESS_TOKEN = 'access_token'
export const COOKIE_REFRESH_TOKEN = 'refresh_token'

function isValidToken(token: string): boolean {
  return typeof token === 'string' && token.trim().length > 0
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_REFRESH_TOKEN)?.value
}

export function setAuthCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  accessToken: string,
  refreshToken: string
) {
  if (!isValidToken(accessToken) || !isValidToken(refreshToken)) {
    throw new Error('Invalid token format: tokens must be non-empty strings')
  }

  const secure = process.env.COOKIE_SECURE === 'true'
  const domain = process.env.COOKIE_DOMAIN

  cookieStore.set(COOKIE_ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 900,
    ...(domain && { domain }),
  })

  cookieStore.set(COOKIE_REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 2592000,
    ...(domain && { domain }),
  })
}

export function clearAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const secure = process.env.COOKIE_SECURE === 'true'
  const domain = process.env.COOKIE_DOMAIN

  const baseOptions = {
    path: '/',
    secure,
    sameSite: 'lax' as const,
    httpOnly: true,
    maxAge: 0,
    ...(domain && { domain }),
  }

  cookieStore.set(COOKIE_ACCESS_TOKEN, '', baseOptions)
  cookieStore.set(COOKIE_REFRESH_TOKEN, '', baseOptions)
}
