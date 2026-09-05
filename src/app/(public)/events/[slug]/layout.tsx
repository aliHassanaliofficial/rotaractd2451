import type { Metadata } from 'next'
import { cache } from 'react'
import { getEventBySlug } from '@/lib/supabase/queries/events.server'
import { SITE_URL, SITE_NAME } from '@/lib/constants'
import { formatEventDateRange } from '@/lib/utils/date'

interface Props {
  params: Promise<{ slug: string }>
}

const getEvent = cache(getEventBySlug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const event = await getEvent(slug)
    const description =
      event.description?.replace(/<[^>]*>/g, '').slice(0, 160) ||
      `Join us for ${event.title} on ${formatEventDateRange(event.start_at, event.end_at)}.`
    const url = `${SITE_URL}/events/${slug}`

    return {
      title: event.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: event.title,
        description,
        type: 'article',
        url,
        images: event.cover_url ? [{ url: event.cover_url }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description,
        images: event.cover_url ? [event.cover_url] : undefined,
      },
    }
  } catch {
    return { title: 'Event Not Found' }
  }
}

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let event: Awaited<ReturnType<typeof getEvent>> | null = null
  try {
    event = await getEvent(slug)
  } catch {
    event = null
  }

  if (!event) return <>{children}</>

  const description =
    event.description?.replace(/<[^>]*>/g, '').slice(0, 300) ||
    `${event.title} — a Rotaract D2451 event on ${formatEventDateRange(event.start_at, event.end_at)}.`
  const url = `${SITE_URL}/events/${slug}`
  const organizerName =
    (event as { host_club?: { name?: string } | null }).host_club?.name || SITE_NAME

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description,
    startDate: event.start_at,
    endDate: event.end_at || event.start_at,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.is_online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.is_online
      ? {
          '@type': 'VirtualLocation',
          url: event.location_url || url,
        }
      : {
          '@type': 'Place',
          name: event.location || 'Egypt',
          address: event.location || 'Egypt',
        },
    image: event.cover_url ? [event.cover_url] : [`${SITE_URL}/opengraph-image`],
    url,
    organizer: {
      '@type': 'Organization',
      name: organizerName,
      url: SITE_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
