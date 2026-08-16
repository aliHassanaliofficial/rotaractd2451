'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { GalleryMedia } from '@/types/database'

interface LightboxProps {
  media: GalleryMedia[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ media, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) {
  const current = media[currentIndex]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onNavigate((currentIndex - 1 + media.length) % media.length)
          break
        case 'ArrowRight':
          onNavigate((currentIndex + 1) % media.length)
          break
      }
    },
    [currentIndex, media.length, onClose, onNavigate]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleShare = async () => {
    if (navigator.share && current) {
      await navigator.share({ url: current.url, title: current.caption || 'Gallery Photo' })
    } else {
      await navigator.clipboard.writeText(current.url)
    }
  }

  const handleDownload = () => {
    if (!current) return
    const a = document.createElement('a')
    a.href = current.url
    a.download = current.caption || 'photo'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        >
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="text-white hover:bg-white/20">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white hover:bg-white/20">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <button
            onClick={() => onNavigate((currentIndex - 1 + media.length) % media.length)}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-[90vh] max-w-[90vw] flex-col items-center"
          >
            {current.type === 'video' ? (
              <video src={current.url} controls className="max-h-[85vh] rounded-2xl" />
            ) : (
              <img
                src={current.url}
                alt={current.caption || 'Gallery image'}
                className="max-h-[85vh] rounded-2xl object-contain"
              />
            )}
            {current.caption && (
              <p className="mt-3 text-sm text-gray-400">{current.caption}</p>
            )}
          </motion.div>

          <button
            onClick={() => onNavigate((currentIndex + 1) % media.length)}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-sm text-gray-500">
            {currentIndex + 1} / {media.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
