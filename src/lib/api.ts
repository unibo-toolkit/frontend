import axios from 'axios'
import { logError } from './logger'

const api = axios.create({
  baseURL: '',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
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

function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  refreshPromise = doRefresh().finally(() => {
    isRefreshing = false
    refreshPromise = null
  })
  return refreshPromise
}

async function forceLogout() {
  if (typeof window !== 'undefined') {
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
