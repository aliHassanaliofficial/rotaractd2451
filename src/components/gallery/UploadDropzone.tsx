'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

interface UploadFile {
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

interface UploadDropzoneProps {
  onUpload: (files: File[]) => Promise<void>
  onDelete?: (index: number) => void
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
}

export function UploadDropzone({
  onUpload,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  disabled = false,
}: UploadDropzoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const newFiles: UploadFile[] = accepted.map((f) => ({
        file: f,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        progress: 0,
        status: 'pending' as const,
      }))
      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles))
    },
    [maxFiles]
  )

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const f = prev[index]
      if (f.preview) URL.revokeObjectURL(f.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    if (!files.length || uploading) return
    setUploading(true)

    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })))

    try {
      await onUpload(files.map((f) => f.file))
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' as const, progress: 100 })))
    } catch {
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error' as const, error: 'Upload failed' }))
      )
    } finally {
      setUploading(false)
    }
  }

  const clearAll = () => {
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview))
    setFiles([])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: disabled || uploading,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors',
          isDragActive
            ? 'border-gold bg-gold/5'
            : 'border-gray-300 bg-gray-50 hover:border-navy hover:bg-gray-100',
          (disabled || uploading) && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn('h-10 w-10 mb-3', isDragActive ? 'text-gold' : 'text-gray-400')} />
        {isDragActive ? (
          <p className="text-sm font-medium text-gold">Drop files here...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600">
              Drag & drop files here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {Object.values(accept).flat().join(', ')} up to {maxSize / 1024 / 1024}MB
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-navy">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={uploading}>
              <X className="mr-1 h-3 w-3" /> Clear all
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${i}`}
                className={cn(
                  'relative flex items-center gap-3 rounded-2xl border p-3 transition-colors',
                  f.status === 'error' && 'border-red-200 bg-red-50',
                  f.status === 'done' && 'border-green-200 bg-green-50'
                )}
              >
                {f.preview ? (
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                    <File className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{f.file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(f.file.size / 1024).toFixed(1)} KB
                  </p>
                  {f.status === 'uploading' && (
                    <Progress value={f.progress} className="mt-2 h-1" />
                  )}
                  {f.status === 'error' && (
                    <p className="text-xs text-red-500">{f.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {f.status === 'done' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {f.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {f.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeFile(i)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleUpload} disabled={uploading || !files.length} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
