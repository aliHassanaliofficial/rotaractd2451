'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { formatTimeAgo } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Loader2, Send, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const notificationSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  message: z.string().optional(),
  target: z.enum(['all_members', 'club_admins', 'all_clubs', 'specific_club']).default('all_members'),
  club_id: z.string().optional(),
})

type NotificationFormData = z.input<typeof notificationSchema>

interface SentNotification {
  id: string
  title: string
  message?: string
  created_at: string
  is_read: boolean
}

export default function AdminNotificationsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [target, setTarget] = useState<string>('all_members')
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { target: 'all_members' },
  })

  useEffect(() => {
    loadHistory()
    supabase.from('clubs').select('id, name').order('name').then((c) => {
      if (c.data) setClubs(c.data)
    })
  }, [])

  async function loadHistory() {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

      setSentNotifications(data || [])
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }

  const onSubmit = async (data: NotificationFormData) => {
    setIsSubmitting(true)
    try {
      let targets: { profile_id: string }[] = []

      if (data.target === 'all_members') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true)

        targets = (profiles || []).map((p: any) => ({ profile_id: p.id }))
      } else if (data.target === 'club_admins') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'club_admin')
          .eq('is_active', true)

        targets = (profiles || []).map((p: any) => ({ profile_id: p.id }))
      } else if (data.target === 'all_clubs') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true)

        targets = (profiles || []).map((p: any) => ({ profile_id: p.id }))
      } else if (data.target === 'specific_club' && data.club_id) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('club_id', data.club_id)
          .eq('is_active', true)

        targets = (profiles || []).map((p: any) => ({ profile_id: p.id }))
      }

      if (targets.length === 0) {
        toast.error('No recipients found')
        setIsSubmitting(false)
        return
      }

      const notifications = targets.map((t) => ({
        profile_id: t.profile_id,
        title: data.title,
        message: data.message || undefined,
      }))

      const { error } = await supabase.from('notifications').insert(notifications)
      if (error) throw error

      toast.success(`Notification sent to ${targets.length} recipient(s)`)
      reset({ title: '', message: '', target: 'all_members', club_id: undefined })
      setTarget('all_members')
      loadHistory()
    } catch {
      toast.error('Failed to send notification')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">Notifications</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Send Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register('title')} placeholder="Notification title" />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea id="message" {...register('message')} rows={3} placeholder="Additional details..." />
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={target} onValueChange={(v) => { setTarget(v); setValue('target', v as any) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_members">All Members</SelectItem>
                    <SelectItem value="club_admins">Club Admins</SelectItem>
                    <SelectItem value="all_clubs">All Clubs</SelectItem>
                    <SelectItem value="specific_club">Specific Club</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {target === 'specific_club' && (
                <div className="space-y-2">
                  <Label>Select Club</Label>
                  <Select onValueChange={(v) => setValue('club_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose club..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Notification
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Recent Notifications Sent</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {loadingHistory ? (
                <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" /></div>
              ) : sentNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No notifications sent yet</p>
                </div>
              ) : (
                sentNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy">{notif.title}</p>
                        {notif.message && <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>}
                      </div>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">{formatTimeAgo(notif.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-xs', notif.is_read ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700')}>
                        {notif.is_read ? 'Read' : 'Unread'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
