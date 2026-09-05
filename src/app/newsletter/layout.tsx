import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Newsletter',
  description:
    'Subscribe to the Rotaract District 2451 Egypt newsletter — monthly updates on events, service projects, and opportunities.',
  alternates: { canonical: '/newsletter' },
}

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return children
}
