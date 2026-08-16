'use client'

import { useState } from 'react'
import { Share2, MessageCircle, Link, Check } from 'lucide-react'

const FacebookIcon = () => (
  <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface ShareButtonsProps {
  url: string
  title: string
  className?: string
}

export function ShareButtons({ url, title, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank', 'noopener')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="mr-1 text-sm text-gray-500">
        <Share2 className="mr-1 inline h-4 w-4" />
        Share
      </span>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={shareWhatsApp} title="Share on WhatsApp">
        <MessageCircle className="h-4 w-4 text-green-600" />
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={shareFacebook} title="Share on Facebook">
        <FacebookIcon />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={copyLink}
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link className="h-4 w-4 text-gray-600" />}
      </Button>
    </div>
  )
}
