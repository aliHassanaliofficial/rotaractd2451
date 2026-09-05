import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'District Calendar',
  description:
    'View the Rotaract D2451 calendar — events, projects, and meetings happening across all clubs in District 2451 Egypt.',
  alternates: { canonical: '/calendar' },
}

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children
}
