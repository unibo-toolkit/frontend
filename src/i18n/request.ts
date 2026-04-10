import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  let locale = cookieStore.get('locale')?.value

  if (!locale) {
    const acceptLang = headerStore.get('accept-language') || ''
    locale = acceptLang.startsWith('it') ? 'it' : 'en'
  }

  if (locale !== 'en' && locale !== 'it') {
    locale = 'en'
  }

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  }
})
