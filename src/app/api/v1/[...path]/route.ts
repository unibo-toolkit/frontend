import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
const PROXY_TIMEOUT = 15_000

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

  const body = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.text()
    : undefined

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT)

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    })
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
    if (error instanceof DOMException && error.name === 'AbortError') {
      logError('API proxy timeout', { url: targetUrl, method: request.method })
      return new NextResponse(JSON.stringify({ error: 'Gateway timeout' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    logError('API proxy error', { url: targetUrl, method: request.method, error: String(error) })
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
