import { refreshToken } from './api'

let refreshInterval: ReturnType<typeof setInterval> | null = null
let authChannel: BroadcastChannel | null = null
let consecutiveFailures = 0

const REFRESH_INTERVAL = 8 * 60 * 1000
const MAX_CONSECUTIVE_FAILURES = 5

export function startBackgroundRefresh(onAuthFailure?: () => void) {
  stopBackgroundRefresh()
  consecutiveFailures = 0

  refreshInterval = setInterval(async () => {
    try {
      const ok = await refreshToken()
      if (ok) {
        consecutiveFailures = 0
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
      if (event.data === 'login' && onLogin) onLogin()
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
