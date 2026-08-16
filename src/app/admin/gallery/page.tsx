'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { updateAlbum } from '@/lib/supabase/queries/gallery'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Plus, Eye, ToggleLeft, ToggleRight, Loader2, ImageIcon, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { GalleryAlbum } from '@/types/database'

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState<(GalleryAlbum & { media?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadAlbums() }, [approvalFilter])

  async function loadAlbums() {
    setLoading(true)
    try {
      let query = supabase
        .from('gallery_albums')
        .select('*, event:event_id(title), club:club_id(name), media:gallery_media(count)')
        .order('created_at', { ascending: false })

      if (approvalFilter !== 'all') {
        query = query.eq('approval_status', approvalFilter)
      }

      const { data } = await query
      setAlbums(data || [])
    } catch {
      toast.error('Failed to load albums')
    } finally {
      setLoading(false)
    }
  }

  async function togglePublish(album: GalleryAlbum) {
    setToggling(album.id)
    try {
      await updateAlbum(album.id, { is_published: !album.is_published })
      setAlbums((prev) => prev.map((a) => (a.id === album.id ? { ...a, is_published: !a.is_published } : a)))
      toast.success(album.is_published ? 'Unpublished' : 'Published')
    } catch {
      toast.error('Failed to toggle')
    } finally {
      setToggling(null)
    }
  }

  async function handleApproval(id: string, status: string) {
    setActionLoading(id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('gallery_albums')
        .update({
          approval_status: status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      toast.success(status === 'approved' ? 'Approved' : 'Rejected')
      setAlbums((prev) => prev.map((a) => a.id === id ? { ...a, approval_status: status } as any : a))
    } catch {
      toast.error('Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  const approvalTabs = ['all', 'pending', 'approved', 'rejected'] as const

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
        <Link href="/admin/gallery/new-album">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Album
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-1 rounded-2xl border bg-gray-50 p-1">
        {approvalTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setApprovalFilter(tab)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
              approvalFilter === tab ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {albums.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 py-16 text-center text-gray-400">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No albums yet</p>
            <Link href="/admin/gallery/new-album">
              <Button variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Album
              </Button>
            </Link>
          </div>
        ) : (
          albums.map((album) => (
            <div key={album.id} className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md">
              <Link href={`/admin/gallery/${album.id}`}>
                <div className="relative aspect-[4/3] bg-gray-100">
                  {album.cover_url ? (
                    <Image src={album.cover_url} alt={album.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge className={cn(
                      'font-medium',
                      album.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    )} variant="outline">
                      {album.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge className={cn('font-medium', APPROVAL_BADGE[(album as any).approval_status || 'approved'])} variant="outline">
                      {(album as any).approval_status || 'approved'}
                    </Badge>
                  </div>
                </div>
              </Link>

              <div className="p-4">
                <Link href={`/admin/gallery/${album.id}`}>
                  <h3 className="font-semibold text-navy truncate hover:text-cranberry transition-colors">{album.title}</h3>
                </Link>
                <p className="mt-0.5 text-xs text-gray-500">
                  {album.media?.[0]?.count || 0} photos
                  {album.event && ` • ${album.event.title}`}
                </p>
                <p className="text-xs text-gray-400">{formatDate(album.created_at)}</p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/gallery/${album.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </Link>
                    {(album as any).approval_status === 'pending' && (
                      <>
                        <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApproval(album.id, 'approved')} disabled={actionLoading === album.id}>
                          {actionLoading === album.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleApproval(album.id, 'rejected')} disabled={actionLoading === album.id}>
                          {actionLoading === album.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(album)}
                    disabled={toggling === album.id}
                    className={album.is_published ? 'text-green-600' : 'text-gray-400'}
                  >
                    {toggling === album.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : album.is_published ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    <span className="ml-1">{album.is_published ? 'Published' : 'Draft'}</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
