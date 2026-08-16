'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markMessageRead } from '@/lib/supabase/queries/settings'
import { formatDate, formatTimeAgo } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Search, Mail, MailOpen, Reply, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { ContactMessage } from '@/types/database'

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null)
  const supabase = createClient()

  useEffect(() => { loadMessages() }, [])

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(msg: ContactMessage) {
    if (msg.is_read) return
    try {
      await markMessageRead(msg.id)
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)))
    } catch {
      // silent
    }
  }

  function handleOpen(msg: ContactMessage) {
    setSelectedMsg(msg)
    handleMarkRead(msg)
  }

  const filtered = messages.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(search.toLowerCase())
  )

  const unread = messages.filter((m) => !m.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Messages</h1>
          <p className="text-sm text-gray-500">
            {unread > 0 ? (
              <span className="text-cranberry font-medium">{unread} unread</span>
            ) : (
              'All messages read'
            )}
            {' • '}{messages.length} total
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              No messages found
            </CardContent>
          </Card>
        ) : (
          filtered.map((msg) => (
            <Card
              key={msg.id}
              className={cn(
                'cursor-pointer transition-colors hover:border-gray-300',
                !msg.is_read && 'border-l-4 border-l-cranberry bg-cranberry/[0.02]'
              )}
              onClick={() => handleOpen(msg)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && (
                        <span className="h-2 w-2 rounded-full bg-cranberry shrink-0" />
                      )}
                      <h3 className={cn('truncate', !msg.is_read ? 'font-semibold text-navy' : 'font-medium text-gray-700')}>
                        {msg.name}
                      </h3>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(msg.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{msg.email}</p>
                    {msg.subject && (
                      <p className={cn('mt-0.5 text-sm', !msg.is_read ? 'font-medium text-navy' : 'text-gray-600')}>
                        {msg.subject}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{msg.message}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    {!msg.is_read ? (
                      <Mail className="h-4 w-4 text-cranberry" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedMsg} onOpenChange={(open) => !open && setSelectedMsg(null)}>
        <DialogContent className="max-w-lg">
          {selectedMsg && (
            <>
              <DialogHeader>
                <DialogTitle className="text-navy">{selectedMsg.subject || 'No Subject'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-navy">{selectedMsg.name}</p>
                    <p className="text-gray-500">{selectedMsg.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(selectedMsg.created_at, 'MMM d, yyyy • h:mm a')}</span>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedMsg.message}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">
                    {selectedMsg.is_read ? 'Read' : 'Unread'} • {selectedMsg.replied_at ? `Replied ${formatDate(selectedMsg.replied_at)}` : 'Not replied'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject || 'Your Message'}`)}>
                    <Reply className="mr-2 h-4 w-4" /> Reply via Email
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
