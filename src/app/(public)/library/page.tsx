'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { FileText, File, Video, Download, Search, BookOpen, FileType, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { LibraryCategory, LibraryItem } from '@/types/database'

const typeIcons: Record<string, typeof FileText> = {
  document: FileText,
  pdf: File,
  video: Video,
  image: FileText,
}

export default function LibraryPage() {
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [items, setItems] = useState<(LibraryItem & { category: LibraryCategory })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (search) params.set('q', search)

      const res = await fetch(`/api/library?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCategories(data.categories || [])
      setItems(data.items || [])
    } catch {
      setItems([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDownload = async (item: LibraryItem) => {
    if (item.file_url) {
      try {
        await fetch('/api/library/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        })
        window.open(item.file_url, '_blank')
      } catch {
        window.open(item.file_url, '_blank')
      }
    } else if (item.external_url) {
      window.open(item.external_url, '_blank')
    }
  }

  const filteredItems = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase()
      return item.title.toLowerCase().includes(q) || item.tags?.some((t) => t.toLowerCase().includes(q))
    }
    return true
  })

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <BookOpen className="h-8 w-8 text-gold" />
            <h1 className="text-4xl font-bold md:text-5xl">Library</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Access resources, documents, and materials from Rotaract.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by title or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="mb-8 flex-wrap">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={activeCategory}>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="mt-2 h-4 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="py-20 text-center">
                      <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                      <p className="text-lg text-gray-400">No library items found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredItems.map((item, i) => {
                        const Icon = typeIcons[item.type] || FileText
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.3 }}
                          >
                            <Card className="group transition-all hover:shadow-md">
                              <CardContent className="flex items-center gap-4 p-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy/5">
                                  <Icon className="h-6 w-6 text-navy" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <h3 className="font-medium text-navy group-hover:text-cranberry">
                                        {item.title}
                                      </h3>
                                      {item.description && (
                                        <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{item.description}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (item.file_url?.endsWith('.pdf')) {
                                          setPreviewUrl(item.file_url)
                                        } else {
                                          handleDownload(item)
                                        }
                                      }}
                                    >
                                      {item.file_url?.endsWith('.pdf') ? (
                                        <>Preview</>
                                      ) : item.file_url ? (
                                        <><Download className="mr-1 h-3 w-3" /> Download</>
                                      ) : (
                                        <><ExternalLink className="mr-1 h-3 w-3" /> Open</>
                                      )}
                                    </Button>
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                    <Badge variant="outline" className="text-[10px] uppercase">{item.type}</Badge>
                                    {item.category && (
                                      <Badge variant="secondary" className="text-[10px]">{item.category.name}</Badge>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Download className="h-3 w-3" />
                                      {item.downloads} downloads
                                    </span>
                                    <span>{formatDate(item.created_at)}</span>
                                    {item.tags && item.tags.length > 0 && item.tags.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-navy">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                      'w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors',
                      activeCategory === 'all' ? 'bg-gradient-to-br from-navy to-cranberry text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    All Resources
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        'w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors',
                        activeCategory === cat.id ? 'bg-cranberry text-white' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <iframe src={previewUrl} className="h-full w-full" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  )
}
