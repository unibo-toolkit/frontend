import { cookies } from 'next/headers'
import LandingPageClient from './LandingPageClient'

export default async function Page() {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value
  const initialTheme: 'dark' | 'light' = themeCookie === 'light' ? 'light' : 'dark'
  return <LandingPageClient initialTheme={initialTheme} />
}
