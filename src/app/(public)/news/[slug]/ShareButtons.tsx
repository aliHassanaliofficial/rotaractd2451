'use client'

import { Share2, Link as LinkIcon, MessageCircle, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareButtonsProps {
  url: string
  title: string
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, '_blank')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={shareWhatsApp} title="Share on WhatsApp">
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={shareFacebook} title="Share on Facebook">
        <Share2 className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={copyLink} title={copied ? 'Copied' : 'Copy link'}>
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
      </Button>
    </div>
  )
}
