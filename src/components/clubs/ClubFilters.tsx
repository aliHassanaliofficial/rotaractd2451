'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'

interface ClubFiltersProps {
  onFilterChange?: (filters: ClubFilterValues) => void
  cities?: string[]
  universities?: string[]
}

export interface ClubFilterValues {
  search: string
  city: string
  university: string
  sortBy: string
}

const sortOptions = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'members', label: 'Most Members' },
  { value: 'members-asc', label: 'Least Members' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
]

export function ClubFilters({ onFilterChange, cities, universities }: ClubFiltersProps) {
  const [filters, setFilters] = useState<ClubFilterValues>({
    search: '',
    city: 'all',
    university: 'all',
    sortBy: 'name',
  })

  const update = (key: keyof ClubFilterValues, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onFilterChange?.(next)
  }

  const clearAll = () => {
    const cleared: ClubFilterValues = { search: '', city: 'all', university: 'all', sortBy: 'name' }
    setFilters(cleared)
    onFilterChange?.(cleared)
  }

  const hasActive = filters.search || filters.city !== 'all' || filters.university !== 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search clubs..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filters.city} onValueChange={(v) => update('city', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities?.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.university} onValueChange={(v) => update('university', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="University" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {universities?.map((uni) => (
              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sortBy} onValueChange={(v) => update('sortBy', v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActive && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>
    </div>
  )
}
