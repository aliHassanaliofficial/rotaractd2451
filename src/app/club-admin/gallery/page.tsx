'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/hooks/useRole'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Plus, Eye, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const APPROVAL_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ClubAdminGalleryPage() {
  const { clubId } = useRole()
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (clubId) loadAlbums()
  }, [clubId])

  async function loadAlbums() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gallery_albums')
        .select('*, media:gallery_media(count)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlbums(data || [])
    } catch {
      toast.error('Failed to load albums')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Gallery Albums</h1>
        <Link href="/club-admin/gallery/new-album">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Album
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4">Photos</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {albums.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No albums yet</p>
                    </td>
                  </tr>
                ) : (
                  albums.map((album) => (
                    <tr key={album.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-navy">{album.title}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn('font-medium', APPROVAL_COLORS[album.approval_status] || 'bg-yellow-100 text-yellow-700')}>
                          {album.approval_status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{album.media?.[0]?.count || 0}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(album.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/club-admin/gallery/${album.id}`}>
                          <Button variant="ghost" size="icon" title="View Media">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
