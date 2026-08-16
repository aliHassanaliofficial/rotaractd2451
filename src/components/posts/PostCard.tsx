'use client'

import { motion } from 'framer-motion'
import { Calendar, Eye, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { TagBadge } from './TagBadge'
import { formatDate } from '@/lib/utils/date'
import type { Post } from '@/types/database'

interface PostCardProps {
  post: Post
  index?: number
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <a href={`/news/${post.slug}`}>
          <div className="relative h-48 overflow-hidden">
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${post.cover_url || '/images/placeholder.jpg'})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </a>

        <CardContent className="p-5">
          {post.tags && post.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          <a href={`/news/${post.slug}`}>
            <h3 className="text-lg font-semibold text-navy line-clamp-2 group-hover:text-cranberry transition-colors">
              {post.title}
            </h3>
          </a>

          {post.excerpt && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-3">
              {post.author && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.author.avatar_url} />
                    <AvatarFallback className="text-[8px] bg-gradient-to-br from-navy to-cranberry text-white">
                      {post.author.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[100px]">{post.author.full_name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.published_at)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.views}
              </span>
            </div>
          </div>

          <Button variant="link" className="mt-3 h-auto p-0 text-cranberry" asChild>
            <a href={`/news/${post.slug}`}>
              Read More <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
