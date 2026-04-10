import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
const PROXY_TIMEOUT = 15_000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 150

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  targetUrl: string,
  init: RequestInit,
  isIdempotent: boolean,
): Promise<Response> {
  let lastError: unknown
  const attempts = isIdempotent ? MAX_RETRIES + 1 : 1

  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(targetUrl, init)
    } catch (error) {
      lastError = error
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      if (i < attempts - 1) {
        await sleep(RETRY_DELAY_MS * (i + 1))
      }
    }
  }
  throw lastError
}

async function proxyRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const targetUrl = `${API_URL}${pathname}${search}`

  const accessToken = request.cookies.get('access_token')?.value

  const headers = new Headers()
  headers.set('Content-Type', request.headers.get('Content-Type') || 'application/json')
  headers.set('Accept', request.headers.get('Accept') || 'application/json')

  const userAgent = request.headers.get('User-Agent')
  if (userAgent) headers.set('User-Agent', userAgent)

  const acceptLanguage = request.headers.get('Accept-Language')
  if (acceptLanguage) headers.set('Accept-Language', acceptLanguage)

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const method = request.method
  const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined
  const isIdempotent = method === 'GET' || method === 'HEAD'

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT)

  try {
    const response = await fetchWithRetry(
      targetUrl,
      {
        method,
        headers,
        body,
        signal: controller.signal,
        cache: 'no-store',
      },
      isIdempotent,
    )
    clearTimeout(timeoutId)

    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return new NextResponse(null, { status: response.status })
    }

    const data = await response.text()

    return new NextResponse(data || null, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      logError('API proxy timeout', { url: targetUrl, method })
      return new NextResponse(JSON.stringify({ error: 'Gateway timeout' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    logError('API proxy error', { url: targetUrl, method, error: String(error) })
    return new NextResponse(JSON.stringify({ error: 'Bad gateway' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
