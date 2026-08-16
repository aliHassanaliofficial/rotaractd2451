'use client'

import { cn } from '@/lib/utils/cn'

interface RichTextRendererProps {
  content: string
  className?: string
}

export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content) return null

  return (
    <div
      className={cn(
        'prose prose-gray max-w-none',
        'prose-headings:text-navy prose-headings:font-bold',
        'prose-a:text-cranberry prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-navy',
        'prose-img:rounded-2xl prose-img:shadow-md',
        'prose-blockquote:border-l-gold prose-blockquote:text-gray-600',
        'prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded',
        'prose-pre:bg-navy prose-pre:text-white',
        'prose-li:marker:text-gold',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
