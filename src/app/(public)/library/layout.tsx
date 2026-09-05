import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Library',
  description:
    'Access documents, guides, and downloadable resources from Rotaract District 2451 Egypt — club tools, reports, and official materials.',
  alternates: { canonical: '/library' },
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children
}
