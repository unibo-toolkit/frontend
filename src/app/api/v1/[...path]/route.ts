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

const FORWARD_HEADERS = [
  'user-agent',
  'accept-language',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-real-ip',
  'true-client-ip',
  'referer',
]

function buildClientIp(request: NextRequest): string | null {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = request.headers.get('x-real-ip')
  if (xri) return xri
  return null
}

async function proxyRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const targetUrl = `${API_URL}${pathname}${search}`

  const accessToken = request.cookies.get('access_token')?.value

  const headers = new Headers()
  headers.set('content-type', request.headers.get('content-type') || 'application/json')
  headers.set('accept', request.headers.get('accept') || 'application/json')

  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const clientIp = buildClientIp(request)
  if (clientIp && !headers.has('cf-connecting-ip')) {
    headers.set('cf-connecting-ip', clientIp)
  }
  if (clientIp && !headers.has('x-forwarded-for')) {
    headers.set('x-forwarded-for', clientIp)
  }

  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`)
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
