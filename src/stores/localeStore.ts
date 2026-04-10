import { create } from 'zustand'

type Locale = 'en' | 'it'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const htmlLang = document.documentElement.lang as Locale
  if (htmlLang === 'it' || htmlLang === 'en') return htmlLang
  const stored = localStorage.getItem('locale') as Locale | null
  if (stored) return stored
  return navigator.language.startsWith('it') ? 'it' : 'en'
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'en',
  setLocale: (locale) => {
    localStorage.setItem('locale', locale)
    const secure = window.location.protocol === 'https:' ? ';Secure' : ''
    document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax${secure}`
    set({ locale })
  },
}))

export function initializeLocale() {
  const locale = getInitialLocale()
  useLocaleStore.setState({ locale })
}
