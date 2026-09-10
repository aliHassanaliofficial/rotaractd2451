import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'District Conference',
  description:
    'The Rotaract District 2451 annual conference — gathering young leaders from across Egypt for a year of inspiration, learning, and fellowship.',
  alternates: { canonical: '/conference' },
}

export default function ConferenceLayout({ children }: { children: React.ReactNode }) {
  return children
}