import type { NextRequest } from 'next/server'

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

function clientIp(source: Headers): string | null {
  const cfIp = source.get('cf-connecting-ip')
  if (cfIp) return cfIp
  const xff = source.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = source.get('x-real-ip')
  if (xri) return xri
  return null
}

export function buildForwardedHeaders(
  source: NextRequest | Headers,
  extra?: Record<string, string>,
): Headers {
  const src: Headers = source instanceof Headers ? source : source.headers
  const headers = new Headers()

  for (const name of FORWARD_HEADERS) {
    const value = src.get(name)
    if (value) headers.set(name, value)
  }

  const ip = clientIp(src)
  if (ip && !headers.has('cf-connecting-ip')) headers.set('cf-connecting-ip', ip)
  if (ip && !headers.has('x-forwarded-for')) headers.set('x-forwarded-for', ip)

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      headers.set(key.toLowerCase(), value)
    }
  }

  return headers
}
