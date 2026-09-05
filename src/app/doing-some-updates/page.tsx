import type { Metadata } from 'next'
import { DoingSomeUpdates } from '@/components/layout/DoingSomeUpdates'

export const metadata: Metadata = {
  title: 'Doing Some Updates',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DoingSomeUpdatesPage() {
  return <DoingSomeUpdates />
}