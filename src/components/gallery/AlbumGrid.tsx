'use client'

import { motion } from 'framer-motion'
import { Image as ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { GalleryAlbum } from '@/types/database'

interface AlbumGridProps {
  albums: GalleryAlbum[]
  loading?: boolean
  emptyMessage?: string
}

export function AlbumGrid({ albums, loading = false, emptyMessage = 'No albums yet.' }: AlbumGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200">
            <div className="h-48 rounded-t-2xl bg-gray-200" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!albums.length) {
    return <div className="py-16 text-center text-gray-500">{emptyMessage}</div>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album, i) => (
        <motion.div
          key={album.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <a href={`/gallery/${album.slug}`} className="group block">
            <Card className="overflow-hidden transition-all group-hover:shadow-lg">
              <div className="relative h-48 overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${album.cover_url || '/images/placeholder.jpg'})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  <ImageIcon className="h-3 w-3" />
                  {album.media?.length || 0}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-navy group-hover:text-cranberry transition-colors line-clamp-1">
                  {album.title}
                </h3>
                {album.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{album.description}</p>
                )}
                {album.event && (
                  <p className="mt-2 text-xs text-gold-dark">{album.event.title}</p>
                )}
              </CardContent>
            </Card>
          </a>
        </motion.div>
      ))}
    </div>
  )
}
