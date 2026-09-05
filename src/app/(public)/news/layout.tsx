import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News & Articles',
  description:
    'Latest news, stories, and articles from Rotaract District 2451 Egypt — club achievements, service projects, and district updates.',
  alternates: { canonical: '/news' },
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children
}
