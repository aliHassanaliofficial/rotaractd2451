import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description:
    'Discover upcoming Rotaract D2451 events across Egypt — service projects, professional development workshops, conferences, fundraisers, and social activities.',
  alternates: { canonical: '/events' },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
