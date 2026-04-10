import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const docTheme = document.documentElement.getAttribute('data-theme') as Theme
  if (docTheme === 'light' || docTheme === 'dark') return docTheme
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    const secure = window.location.protocol === 'https:' ? ';Secure' : ''
    document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax${secure}`
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))

export function initializeTheme() {
  const theme = getInitialTheme()
  useThemeStore.getState().setTheme(theme)
}
