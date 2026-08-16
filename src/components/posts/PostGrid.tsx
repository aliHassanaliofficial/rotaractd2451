'use client'

import { PostCard } from './PostCard'
import type { Post } from '@/types/database'

interface PostGridProps {
  posts: Post[]
  loading?: boolean
  emptyMessage?: string
}

export function PostGrid({ posts, loading = false, emptyMessage = 'No posts found.' }: PostGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200">
            <div className="h-48 rounded-t-2xl bg-gray-200" />
            <div className="space-y-3 p-5">
              <div className="flex gap-1.5">
                <div className="h-5 w-14 rounded-full bg-gray-200" />
                <div className="h-5 w-16 rounded-full bg-gray-200" />
              </div>
              <div className="h-5 w-full rounded bg-gray-200" />
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="flex gap-3">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!posts.length) {
    return <div className="py-16 text-center text-gray-500">{emptyMessage}</div>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} index={i} />
      ))}
    </div>
  )
}
