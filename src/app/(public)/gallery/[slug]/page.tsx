'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getAlbumBySlug, getAlbumMedia } from '@/lib/supabase/queries/gallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/date'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Download, ImageIcon, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { GalleryAlbum, GalleryMedia } from '@/types/database'

interface Props {
  params: Promise<{ slug: string }>
}

export default function GalleryAlbumPage({ params }: Props) {
  const { slug } = use(params)
  const [album, setAlbum] = useState<(GalleryAlbum & { event: any; club: any }) | null>(null)
  const [media, setMedia] = useState<GalleryMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const albumData = await getAlbumBySlug(slug)
        const mediaData = await getAlbumMedia(albumData.id)
        setAlbum(albumData)
        setMedia(mediaData)
      } catch {
        setAlbum(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % media.length)
  }, [media.length])

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + media.length) % media.length)
  }, [media.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, closeLightbox, goNext, goPrev])

  const downloadPhoto = async (item: GalleryMedia) => {
    try {
      const res = await fetch(item.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.caption || `photo-${item.id}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Photo downloaded')
    } catch {
      toast.error('Failed to download photo')
    }
  }

  if (loading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="mb-6 h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!album) return notFound()

  return (
    <div className="flex flex-col py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gallery" className="flex items-center gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-navy">{album.title}</h1>
          {album.description && <p className="mb-4 text-gray-500">{album.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              {media.length} photos
            </span>
            {album.event && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {album.event.title}
              </span>
            )}
            {album.club && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {album.club.name}
              </span>
            )}
          </div>
        </div>

        {media.length === 0 ? (
          <div className="py-20 text-center">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-400">No photos in this album yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {media.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl"
                onClick={() => openLightbox(i)}
              >
                <Image
                  src={item.thumbnail_url || item.url}
                  alt={item.caption || `Photo ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                <div className="absolute bottom-0 left-0 right-0 flex translate-y-full items-center justify-between p-3 transition-transform group-hover:translate-y-0">
                  {item.caption && (
                    <p className="truncate text-sm text-white drop-shadow-lg">{item.caption}</p>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadPhoto(item) }}
                    className="rounded-full bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-white/40"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex h-full w-full items-center justify-center p-16"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={media[lightboxIndex]?.url || ''}
                alt={media[lightboxIndex]?.caption || `Photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>

            <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
              {lightboxIndex + 1} / {media.length}
              {media[lightboxIndex]?.caption && (
                <span className="ml-2 text-white/70">- {media[lightboxIndex].caption}</span>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); downloadPhoto(media[lightboxIndex]) }}
              className="absolute bottom-6 right-6 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
