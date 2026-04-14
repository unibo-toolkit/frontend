import axios from 'axios'
import { logError } from './logger'

const api = axios.create({
  baseURL: '',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const REFRESH_TIMEOUT = 10_000
const FRESH_TTL = 5_000
const LS_KEY = 'auth_last_refresh'

let pendingRefresh: Promise<boolean> | null = null
let logoutInProgress = false

function getLastRefreshTime(): number {
  try {
    return parseInt(localStorage.getItem(LS_KEY) || '0', 10)
  } catch {
    return 0
  }
}

function setLastRefreshTime() {
  try {
    localStorage.setItem(LS_KEY, Date.now().toString())
  } catch {}
}

async function doRefreshFetch(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT)
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return res.ok
  } catch {
    return false
  }
}

async function refreshIfNeeded(): Promise<boolean> {
  if (Date.now() - getLastRefreshTime() < FRESH_TTL) return true

  const ok = await doRefreshFetch()
  if (ok) setLastRefreshTime()
  return ok
}

async function refreshWithLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('auth-refresh', async () => {
      return refreshIfNeeded()
    })
  }
  return refreshIfNeeded()
}

export function refreshToken(): Promise<boolean> {
  if (logoutInProgress) return Promise.resolve(false)
  if (pendingRefresh) return pendingRefresh

  pendingRefresh = refreshWithLock().finally(() => {
    pendingRefresh = null
  })

  return pendingRefresh
}

export function markLogoutInProgress() {
  logoutInProgress = true
}

export function clearLogoutFlag() {
  logoutInProgress = false
}

async function forceLogout() {
  if (typeof window !== 'undefined') {
    markLogoutInProgress()
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    try {
      const { useAuthStore } = await import('@/stores/authStore')
      useAuthStore.getState().logout()
    } catch {}
    window.location.href = '/auth'
  }
}

function isRbacAuthError(responseData: unknown): boolean {
  if (!responseData) return false
  const text = typeof responseData === 'string'
    ? responseData
    : JSON.stringify(responseData)
  return text.includes('RBAC')
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    if (!error.response) {
      logError('API request failed (network error)', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
      })
      return Promise.reject(error)
    }

    const isAuthError =
      status === 401 ||
      (status === 403 && isRbacAuthError(error.response?.data))

    if (isAuthError && !error.config._retry) {
      error.config._retry = true
      const refreshed = await refreshToken()
      if (refreshed) {
        return api(error.config)
      }
      await forceLogout()
      return Promise.reject(error)
    }

    logError('API request failed', {
      url: error.config?.url,
      method: error.config?.method,
      status,
      data: error.response?.data,
    })

    return Promise.reject(error)
  }
)

export default api
