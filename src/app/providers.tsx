'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, ReactNode } from 'react'
import { initializeTheme } from '@/stores/themeStore'
import { useAuth } from '@/hooks/useAuth'

function AuthGate({ children, hasAuth }: { children: ReactNode; hasAuth?: boolean }) {
  const { authReady } = useAuth(!!hasAuth)

  // No cookie = no auth needed, show immediately
  if (!hasAuth) return <>{children}</>

  // Cookie exists but user data not loaded yet — show spinner
  if (!authReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #e5e7eb',
            borderTopColor: '#6b7280',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return <>{children}</>
}

interface ProvidersProps {
  children: ReactNode
  hasAuth?: boolean
}

export default function Providers({ children, hasAuth }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  useEffect(() => {
    initializeTheme()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate hasAuth={hasAuth}>
        {children}
      </AuthGate>
    </QueryClientProvider>
  )
}
