'use client'

import { motion } from 'framer-motion'
import { Calendar, Eye, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { Post } from '@/types/database'

interface LatestNewsProps {
  posts?: Post[]
}

const defaultPosts: Post[] = [
  {
    id: '1',
    slug: 'district-conference-2026-announcement',
    title: 'District Conference 2026: Save the Date',
    excerpt: 'We are excited to announce the annual District Conference will be held in Cairo this March. Prepare for three days of leadership, networking, and service.',
    cover_url: '/images/news-1.jpg',
    tags: ['Conference', 'Announcement'],
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    views: 342,
    is_announcement: true,
    is_pinned: true,
    announcement_priority: 'important',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'new-clubs-chartered',
    title: 'Three New Clubs Chartered This Quarter',
    excerpt: 'Three new clubs from universities across Egypt join Rotaract, expanding our reach and impact in local communities.',
    cover_url: '/images/news-2.jpg',
    tags: ['Clubs', 'Growth'],
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    views: 189,
    is_announcement: false,
    is_pinned: false,
    announcement_priority: 'normal',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    slug: 'service-project-highlights',
    title: 'Service Project Highlights: Making an Impact',
    excerpt: 'From environmental cleanups to literacy drives, our clubs have been busy creating positive change. Read about the most impactful projects this month.',
    cover_url: '/images/news-3.jpg',
    tags: ['Service', 'Impact'],
    published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    views: 256,
    is_announcement: false,
    is_pinned: false,
    announcement_priority: 'normal',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function LatestNews({ posts = defaultPosts }: LatestNewsProps) {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-navy">Latest News</h2>
            <p className="mt-2 text-gray-600">Stay updated with district happenings</p>
          </div>
          <Button asChild variant="outline">
            <a href="/news">View All</a>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="group h-full overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${post.cover_url || '/images/placeholder.jpg'})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold-dark"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-navy line-clamp-2 group-hover:text-cranberry transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.published_at ? formatDate(post.published_at) : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views}
                    </span>
                  </div>
                  <Button variant="link" className="mt-3 h-auto p-0 text-cranberry" asChild>
                    <a href={`/news/${post.slug}`}>
                      Read More <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
