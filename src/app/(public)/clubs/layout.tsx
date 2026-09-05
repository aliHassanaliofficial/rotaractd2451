import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Clubs',
  description:
    'Explore Rotaract clubs across Egypt in District 2451 — university and community clubs empowering young leaders nationwide.',
  alternates: { canonical: '/clubs' },
}

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return children
}
