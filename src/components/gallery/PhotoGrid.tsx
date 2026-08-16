'use client'

import { motion } from 'framer-motion'
import { Play, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { GalleryMedia } from '@/types/database'

interface PhotoGridProps {
  media: GalleryMedia[]
  onSelect?: (media: GalleryMedia) => void
  loading?: boolean
  emptyMessage?: string
}

export function PhotoGrid({ media, onSelect, loading = false, emptyMessage = 'No photos yet.' }: PhotoGridProps) {
  if (loading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    )
  }

  if (!media.length) {
    return <div className="py-16 text-center text-gray-500">{emptyMessage}</div>
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {media.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: i * 0.02 }}
          className={cn(
            'group relative cursor-pointer overflow-hidden rounded-2xl',
            item.type === 'video' ? 'aspect-video' : 'aspect-square'
          )}
          onClick={() => onSelect?.(item)}
        >
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: `url(${item.thumbnail_url || item.url})`,
            }}
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <Play className="ml-0.5 h-5 w-5 text-navy" />
              </div>
            </div>
          )}

          {item.type === 'document' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <FileText className="h-5 w-5 text-navy" />
              </div>
            </div>
          )}

          {item.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-xs text-white line-clamp-2">{item.caption}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
