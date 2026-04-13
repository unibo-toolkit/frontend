'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { startBackgroundRefresh, stopBackgroundRefresh, initAuthChannel, broadcastLogout, destroyAuthChannel } from '@/lib/auth'
import { markLogoutInProgress } from '@/lib/api'
import api from '@/lib/api'
import type { User } from '@/types/auth'

export async function performLogout() {
  markLogoutInProgress()
  stopBackgroundRefresh()
  try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
  useAuthStore.getState().logout()
  broadcastLogout()
  window.location.href = '/'
}

export function useAuth(enabled = true) {
  const { isLoggedIn, user, setUser, logout } = useAuthStore()
  const [authReady, setAuthReady] = useState(!enabled)

  const handleAuthFailure = useCallback(async () => {
    markLogoutInProgress()
    stopBackgroundRefresh()
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    logout()
    window.location.href = '/auth'
  }, [logout])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const checkAuth = async () => {
      try {
        const { data } = await api.get<User>('/api/v1/users/me/')
        if (!cancelled) {
          setUser(data)
          startBackgroundRefresh(handleAuthFailure)
        }
      } catch {
        if (!cancelled) {
          logout()
          stopBackgroundRefresh()
        }
      }
      if (!cancelled) setAuthReady(true)
    }

    checkAuth()

    initAuthChannel(
      () => {
        logout()
        stopBackgroundRefresh()
        window.location.href = '/'
      },
      () => {
        api.get<User>('/api/v1/users/me/').then(({ data }) => {
          setUser(data)
        }).catch(() => {})
      }
    )

    return () => {
      cancelled = true
      stopBackgroundRefresh()
      destroyAuthChannel()
    }
  }, [enabled, handleAuthFailure, logout, setUser])

  return { isLoggedIn, user, logout: performLogout, authReady }
}
