'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { formatTimeAgo } from '@/lib/utils/date'
import { toast } from 'sonner'
import {
  Bell,
  Loader2,
  CheckCheck,
  Trash2,
  ChevronRight,
  BellRing,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import type { Notification } from '@/types/database'

export default function ClubAdminNotificationsPage() {
  const { user, loading: userLoading } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchNotifications()
  }, [user])

  const handleMarkRead = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id))
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      if (error) throw error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      toast.error('Failed to mark as read')
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    setProcessingIds(new Set(unreadIds))
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) throw error
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setProcessingIds(new Set())
    }
  }

  const handleClearAll = async () => {
    if (!user) return

    const ids = notifications.map((n) => n.id)
    setProcessingIds(new Set(ids))

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('profile_id', user.id)

      if (error) throw error
      setNotifications([])
      toast.success('All notifications cleared')
    } catch {
      toast.error('Failed to clear notifications')
    } finally {
      setProcessingIds(new Set())
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (userLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-1 h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-12 text-center text-gray-500">
        Please sign in to view your notifications.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-cranberry" />
          <h1 className="text-3xl font-bold text-navy">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="cranberry" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark All Read
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={handleClearAll}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BellRing className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400">You&apos;re all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const isProcessing = processingIds.has(notification.id)

            return (
              <Card
                key={notification.id}
                className={cn(
                  'transition-colors',
                  !notification.is_read ? 'border-cranberry/20 bg-cranberry/5' : 'opacity-70'
                )}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                      notification.is_read ? 'bg-transparent' : 'bg-cranberry'
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            !notification.is_read ? 'text-navy' : 'text-gray-600'
                          )}
                        >
                          {notification.link ? (
                            <Link href={notification.link} className="hover:text-cranberry">
                              {notification.title}
                            </Link>
                          ) : (
                            notification.title
                          )}
                        </p>
                        {notification.message && (
                          <p className="mt-0.5 text-xs text-gray-500">{notification.message}</p>
                        )}
                      </div>

                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 shrink-0 px-2"
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCheck className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {notification.link && (
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300" />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
