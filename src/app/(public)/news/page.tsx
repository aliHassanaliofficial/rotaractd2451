'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Search, Calendar, User } from 'lucide-react'
import type { Post } from '@/types/database'

const POSTS_PER_PAGE = 9

function NewsSkeleton() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto h-12 w-48 animate-pulse rounded bg-white/20" />
          <div className="mx-auto mt-4 h-6 w-96 animate-pulse rounded bg-white/10" />
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="mb-2 h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function NewsPageWrapper() {
  return (
    <Suspense fallback={<NewsSkeleton />}>
      <NewsPage />
    </Suspense>
  )
}

function NewsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<(Post & { author: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [allTags, setAllTags] = useState<string[]>([])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTag) params.set('tag', activeTag)
      if (page > 1) params.set('page', String(page))
      if (search) params.set('q', search)
      params.set('limit', String(POSTS_PER_PAGE))
      params.set('offset', String((page - 1) * POSTS_PER_PAGE))

      const res = await fetch(`/api/posts?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPosts(data.posts || [])
      setAllTags(data.tags || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [activeTag, page, search])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTag) params.set('tag', activeTag)
    if (page > 1) params.set('page', String(page))
    if (search) params.set('q', search)
    const qs = params.toString()
    router.replace(`/news${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [activeTag, page, search, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPosts()
  }

  const totalPages = Math.ceil((posts.length || 1) / POSTS_PER_PAGE)

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">News & Updates</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Stay informed with the latest news from Rotaract.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearch} className="relative md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search news..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </form>
          </div>

          {allTags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <button
                onClick={() => { setActiveTag(''); setPage(1) }}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  !activeTag
                    ? 'bg-gradient-to-br from-navy to-cranberry text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setActiveTag(tag === activeTag ? '' : tag); setPage(1) }}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    activeTag === tag
                      ? 'bg-cranberry text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <CardContent className="p-4">
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="mb-2 h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg text-gray-400">No news articles found.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setActiveTag(''); setPage(1) }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <Link href={`/news/${post.slug}`}>
                      <Card className="group h-full overflow-hidden">
                        <div className="relative h-48 overflow-hidden">
                          {post.cover_url ? (
                            <Image src={post.cover_url} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy/10 to-gold/10" />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                            {post.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.published_at)}
                              </span>
                            )}
                            {post.author && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {post.author.full_name}
                              </span>
                            )}
                          </div>
                          <h3 className="mb-2 line-clamp-2 font-semibold text-navy group-hover:text-cranberry">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="mb-3 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
