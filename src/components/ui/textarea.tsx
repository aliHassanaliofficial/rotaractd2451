import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-2xl border border-white/60 bg-white/60 px-3 py-2 text-sm text-navy shadow-sm backdrop-blur-md transition-all placeholder:text-gray-400 hover:border-navy/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:border-gold/40 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
