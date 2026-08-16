import Link from 'next/link'
import { getAllAnnouncements } from '@/lib/supabase/queries/posts'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Megaphone, Pin, Calendar, ArrowRight } from 'lucide-react'
import { ANNOUNCEMENT_PRIORITIES } from '@/lib/constants'
import type { Post } from '@/types/database'

export default async function AnnouncementsPage() {
  const announcements = await getAllAnnouncements().catch(() => [])

  const pinned = announcements.filter((a) => a.is_pinned)
  const grouped = {
    urgent: announcements.filter((a) => !a.is_pinned && a.announcement_priority === 'urgent'),
    important: announcements.filter((a) => !a.is_pinned && a.announcement_priority === 'important'),
    normal: announcements.filter((a) => !a.is_pinned && a.announcement_priority === 'normal'),
  }

  const priorityConfig: Record<string, { label: string; color: string; badgeVariant: 'destructive' | 'cranberry' | 'outline' }> = {
    urgent: { label: 'Urgent', color: 'border-l-red-500', badgeVariant: 'destructive' },
    important: { label: 'Important', color: 'border-l-cranberry', badgeVariant: 'cranberry' },
    normal: { label: 'Normal', color: 'border-l-gray-400', badgeVariant: 'outline' },
  }

  const renderCard = (a: Post) => {
    const config = priorityConfig[a.announcement_priority] || priorityConfig.normal
    return (
      <Card
        key={a.id}
        id={a.id}
        className={cn(
          'border-l-4 transition-all hover:shadow-md',
          config.color,
          a.is_pinned && 'bg-gold/5'
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={config.badgeVariant}>{config.label}</Badge>
                {a.is_pinned && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
                {a.published_at && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(a.published_at)}
                  </span>
                )}
              </div>
              <h3 className="mb-1 text-lg font-semibold text-navy">{a.title}</h3>
              {a.excerpt && <p className="text-sm text-gray-500">{a.excerpt}</p>}
              {a.tags && a.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Link
              href={`/news/${a.slug}`}
              className="mt-1 shrink-0 text-cranberry transition-colors hover:text-cranberry/80"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Megaphone className="h-8 w-8 text-gold" />
            <h1 className="text-4xl font-bold md:text-5xl">Announcements</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Important updates and information from Rotaract.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          {announcements.length === 0 ? (
            <div className="py-20 text-center">
              <Megaphone className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg text-gray-400">No announcements at this time.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {pinned.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy">
                    <Pin className="h-5 w-5 text-gold" />
                    Pinned
                  </h2>
                  <div className="space-y-3">{pinned.map(renderCard)}</div>
                </div>
              )}

              {grouped.urgent.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-red-600">Urgent</h2>
                  <div className="space-y-3">{grouped.urgent.map(renderCard)}</div>
                </div>
              )}

              {grouped.important.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-cranberry">Important</h2>
                  <div className="space-y-3">{grouped.important.map(renderCard)}</div>
                </div>
              )}

              {grouped.normal.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-gray-600">General</h2>
                  <div className="space-y-3">{grouped.normal.map(renderCard)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
