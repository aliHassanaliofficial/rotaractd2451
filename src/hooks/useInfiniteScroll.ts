'use client'

import { useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll(
  onLoadMore: () => void,
  options?: { threshold?: number; enabled?: boolean }
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && (options?.enabled ?? true)) {
        onLoadMore()
      }
    },
    [onLoadMore, options?.enabled]
  )

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: `${options?.threshold ?? 200}px`,
    })

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [handleIntersect, options?.threshold])

  return { sentinelRef }
}
