import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-2xl border border-white/60 bg-white/60 px-3 py-1 text-sm text-navy shadow-sm backdrop-blur-md transition-all placeholder:text-gray-400 hover:border-navy/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:border-gold/40 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-navy',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
