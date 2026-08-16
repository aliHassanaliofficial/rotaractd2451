import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-navy to-rotary-blue text-white shadow-lg shadow-navy/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy/30',
        destructive: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/30',
        outline: 'border border-white/60 bg-white/50 text-navy shadow-sm backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md',
        secondary: 'bg-gradient-to-br from-gold to-gold/85 text-navy shadow-lg shadow-gold/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gold/35',
        ghost: 'hover:bg-navy/5 hover:text-navy',
        link: 'text-navy underline-offset-4 hover:underline',
        cranberry: 'bg-gradient-to-br from-cranberry to-deep-cranberry text-white shadow-lg shadow-cranberry/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cranberry/35',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-2xl px-3 text-xs',
        lg: 'h-11 rounded-2xl px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
