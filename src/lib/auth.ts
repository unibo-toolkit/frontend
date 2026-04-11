let refreshInterval: ReturnType<typeof setInterval> | null = null
let authChannel: BroadcastChannel | null = null
let consecutiveFailures = 0

const REFRESH_INTERVAL = 8 * 60 * 1000
const MAX_CONSECUTIVE_FAILURES = 5
const REFRESH_TIMEOUT = 10_000

export function startBackgroundRefresh(onAuthFailure?: () => void) {
  stopBackgroundRefresh()
  consecutiveFailures = 0

  refreshInterval = setInterval(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT)

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        consecutiveFailures = 0
      } else if (res.status === 401 || res.status === 403) {
        stopBackgroundRefresh()
        onAuthFailure?.()
      } else {
        consecutiveFailures++
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          stopBackgroundRefresh()
          onAuthFailure?.()
        }
      }
    } catch {
      consecutiveFailures++
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        stopBackgroundRefresh()
        onAuthFailure?.()
      }
    }
  }, REFRESH_INTERVAL)
}

export function stopBackgroundRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
  consecutiveFailures = 0
}

export function initAuthChannel(onLogout: () => void, onLogin?: () => void) {
  if (typeof window === 'undefined') return
  try {
    authChannel = new BroadcastChannel('auth')
    authChannel.onmessage = (event) => {
      if (event.data === 'logout') onLogout()
      if (event.data === 'login') {
        if (onLogin) {
          onLogin()
        }
      }
    }
  } catch {}
}

export function broadcastLogout() {
  try { authChannel?.postMessage('logout') } catch {}
}

export function destroyAuthChannel() {
  try { authChannel?.close() } catch {}
  authChannel = null
}
