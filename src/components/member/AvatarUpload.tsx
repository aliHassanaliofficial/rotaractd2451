'use client'

import { useRef, useState } from 'react'
import { Loader2, Camera } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { STORAGE_BUCKETS } from '@/lib/constants'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024

interface AvatarUploadProps {
  value: string | null
  onChange: (url: string) => void
  name?: string
}

export function AvatarUpload({ value, onChange, name }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Image must be under 2MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', STORAGE_BUCKETS.AVATARS)
      formData.append('folder', 'avatars')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to upload photo')
        return
      }

      onChange(data.url)
      toast.success('Profile photo uploaded')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20 border-2 border-gold/30">
          <AvatarImage src={value || ''} />
          <AvatarFallback className="bg-cranberry/10 text-xl text-cranberry">
            {name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-navy to-cranberry text-white shadow transition hover:brightness-110 disabled:opacity-50"
          aria-label="Upload profile photo"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-navy">Profile Photo</p>
        <p className="text-xs text-gray-500">
          Required. Shown on your profile and in your club&apos;s officers &amp; members sections.
        </p>
      </div>
    </div>
  )
}
