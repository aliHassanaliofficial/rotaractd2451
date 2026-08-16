'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Calendar, Users, FileText, BookOpen, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/date'

type ResultGroup = {
  type: 'events' | 'posts' | 'clubs' | 'library'
  label: string
  items: any[]
  icon: typeof Calendar
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ResultGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="rounded-2xl bg-gold/30 px-0.5 text-navy">{part}</mark>
        : part
    )
  }

  const typeIcons: Record<string, typeof Calendar> = {
    events: Calendar,
    posts: FileText,
    clubs: Users,
    library: BookOpen,
  }

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Search</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
            Search across events, news, clubs, and library resources.
          </p>
          <form onSubmit={handleSearch} className="mx-auto flex max-w-xl gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything..."
                className="h-12 bg-white pl-12 text-navy shadow-lg"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="h-12 bg-gold text-navy hover:bg-gold/90" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          {loading ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-4 h-6 w-32" />
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <Card key={j}>
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="mt-2 h-4 w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : !searched ? (
            <div className="py-20 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-lg text-gray-400">Enter a search term to find results.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-navy">No results found</h3>
              <p className="text-gray-500">
                No results for &ldquo;{query}&rdquo;. Try a different term.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {results.map((group) => {
                const Icon = group.icon
                return (
                  <motion.div
                    key={group.type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-gold" />
                      <h2 className="text-lg font-semibold text-navy">{group.label}</h2>
                      <Badge variant="outline" className="ml-auto">{group.items.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {group.items.map((item: any) => (
                        <Link key={item.id} href={getItemHref(group.type, item)}>
                          <Card className="group transition-all hover:shadow-md">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-navy group-hover:text-cranberry">
                                    {highlightMatch(item.title || item.name)}
                                  </h3>
                                  {(item.excerpt || item.description) && (
                                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                      {highlightMatch(item.excerpt || item.description || '')}
                                    </p>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                    {item.published_at && <span>{formatDate(item.published_at)}</span>}
                                    {item.start_at && <span>{formatDate(item.start_at)}</span>}
                                    {item.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {item.location}
                                      </span>
                                    )}
                                    {item.city && <span>{item.city}</span>}
                                    {item.university && <span>{item.university}</span>}
                                    {item.tags && item.tags.length > 0 && item.tags.slice(0, 3).map((tag: string) => (
                                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function getItemHref(type: string, item: any): string {
  switch (type) {
    case 'events': return `/events/${item.slug}`
    case 'posts': return `/news/${item.slug}`
    case 'clubs': return `/clubs/${item.slug}`
    case 'library': return item.file_url || item.external_url || '/library'
    default: return '/'
  }
}
