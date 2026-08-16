'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EVENT_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'

interface EventFiltersProps {
  onFilterChange?: (filters: FilterValues) => void
  clubs?: { value: string; label: string }[]
}

export interface FilterValues {
  search: string
  category: string
  dateRange: string
  clubId: string
  priceType: string
}

const dateRangeOptions = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'upcoming', label: 'Upcoming' },
]

const priceOptions = [
  { value: 'all', label: 'Any Price' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

export function EventFilters({ onFilterChange, clubs }: EventFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    category: 'all',
    dateRange: 'all',
    clubId: 'all',
    priceType: 'all',
  })

  const update = (key: keyof FilterValues, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onFilterChange?.(next)
  }

  const clearAll = () => {
    const cleared: FilterValues = {
      search: '',
      category: 'all',
      dateRange: 'all',
      clubId: 'all',
      priceType: 'all',
    }
    setFilters(cleared)
    onFilterChange?.(cleared)
  }

  const hasActive = Object.values(filters).some((v) => v && v !== 'all')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filters.category} onValueChange={(v) => update('category', v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.dateRange} onValueChange={(v) => update('dateRange', v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(showAdvanced && 'bg-gradient-to-br from-navy to-cranberry text-white')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          {hasActive && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="mr-1 h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap gap-3 rounded-2xl border p-4">
          {clubs && clubs.length > 0 && (
            <Select value={filters.clubId} onValueChange={(v) => update('clubId', v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Host Club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.value} value={club.value}>
                    {club.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filters.priceType} onValueChange={(v) => update('priceType', v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              {priceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
