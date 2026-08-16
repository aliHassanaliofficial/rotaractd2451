'use client'

import { cn } from '@/lib/utils/cn'
import { Label } from '@/components/ui/label'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  startLabel?: string
  endLabel?: string
  minDate?: string
  maxDate?: string
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  minDate,
  maxDate,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end', className)}>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="start-date">{startLabel}</Label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          className="flex h-9 w-full rounded-2xl border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-navy placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex-1 space-y-1.5">
        <Label htmlFor="end-date">{endLabel}</Label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate || minDate}
          max={maxDate}
          className="flex h-9 w-full rounded-2xl border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-navy placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  )
}
