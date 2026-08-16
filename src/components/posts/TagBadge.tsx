'use client'

import { cn } from '@/lib/utils/cn'

interface TagBadgeProps {
  tag: string
  active?: boolean
  onClick?: () => void
  className?: string
}

export function TagBadge({ tag, active = false, onClick, className }: TagBadgeProps) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) onClick()
      }}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-cranberry text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      #{tag}
    </span>
  )
}
