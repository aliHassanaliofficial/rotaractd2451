'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

interface ImageFile {
  file: File
  preview: string
  progress: number
  uploaded: boolean
}

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<string>
  onDelete?: (url: string) => void
  existingImages?: string[]
  maxSize?: number
  className?: string
}

export function ImageUploader({
  onUpload,
  onDelete,
  existingImages = [],
  maxSize = 5 * 1024 * 1024,
  className,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const newImages: ImageFile[] = accepted.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        progress: 0,
        uploaded: false,
      }))
      setImages((prev) => [...prev, ...newImages])
    },
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize,
    disabled: uploading,
  })

  const handleUpload = async (img: ImageFile, index: number) => {
    setUploading(true)
    try {
      setImages((prev) =>
        prev.map((p, i) => (i === index ? { ...p, progress: 50 } : p))
      )
      await onUpload(img.file)
      setImages((prev) =>
        prev.map((p, i) => (i === index ? { ...p, progress: 100, uploaded: true } : p))
      )
    } catch {
      setImages((prev) => prev.filter((_, i) => i !== index))
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const img = images[index]
    URL.revokeObjectURL(img.preview)
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExisting = (url: string) => {
    onDelete?.(url)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors',
          isDragActive
            ? 'border-gold bg-gold/5'
            : 'border-gray-300 bg-gray-50 hover:border-navy hover:bg-gray-100',
          uploading && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn('h-8 w-8 mb-2', isDragActive ? 'text-gold' : 'text-gray-400')} />
        <p className="text-sm text-gray-600">
          {isDragActive ? 'Drop images here...' : 'Drop images or click to browse'}
        </p>
        <p className="text-xs text-gray-400">PNG, JPG, WebP up to {maxSize / 1024 / 1024}MB</p>
      </div>

      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {existingImages.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-2xl border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removeExisting(url)}
                className="absolute right-1 top-1 hidden rounded-full bg-red-500 p-1 text-white group-hover:block"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {images.map((img, i) => (
            <div key={img.preview} className="group relative aspect-square overflow-hidden rounded-2xl border">
              <img src={img.preview} alt="" className="h-full w-full object-cover" />
              {img.progress < 100 && img.progress > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Progress value={img.progress} className="mx-4 h-2" />
                </div>
              )}
              {!img.uploaded && img.progress === 0 && (
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-black/40">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpload(img, i)}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Image className="h-3 w-3" />
                    )}
                    Upload
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {img.uploaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                  <span className="text-xs font-medium text-green-700">Uploaded</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
