'use client'

import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: { value: number; positive?: boolean }
  variant?: 'default' | 'cranberry' | 'gold'
  className?: string
}

const variantStyles = {
  default: 'bg-gradient-to-br from-navy via-[#0a4a82] to-rotary-blue text-white',
  cranberry: 'bg-cranberry text-white',
  gold: 'bg-gold text-navy',
}

export function StatsCard({ icon, value, label, trend, variant = 'default', className }: StatsCardProps) {
  return (
    <div className={cn('rounded-2xl p-5 shadow-sm', variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="rounded-2xl bg-white/20 p-2">{icon}</div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trend.positive
                ? 'bg-green-400/20 text-green-200'
                : 'bg-red-400/20 text-red-200'
            )}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-3xl font-bold">{value}</div>
        <div className="mt-1 text-sm opacity-80">{label}</div>
      </div>
    </div>
  )
}
