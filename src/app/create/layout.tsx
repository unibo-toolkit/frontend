import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create calendar',
  description: 'Create a personal calendar link for your University of Bologna schedule in 30 seconds. Works with Apple Calendar, Google Calendar, and Outlook.',
  openGraph: {
    title: 'Create your UniBo calendar — UniPlanner',
    description: 'Generate a personal calendar link in 30 seconds.',
  },
  alternates: {
    canonical: 'https://uniplanner.it/create',
  },
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
