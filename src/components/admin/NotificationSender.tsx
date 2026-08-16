'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, Loader2, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils/cn'

const broadcastSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  target: z.enum(['all', 'club_admins', 'district_admin', 'members']),
  club_id: z.string().optional(),
  channel: z.enum(['in_app', 'email', 'both']),
})

type BroadcastForm = z.infer<typeof broadcastSchema>

interface NotificationSenderProps {
  clubs?: { value: string; label: string }[]
  onSend: (data: BroadcastForm) => Promise<void>
}

export function NotificationSender({ clubs = [], onSend }: NotificationSenderProps) {
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      target: 'all',
      channel: 'in_app',
      title: '',
      message: '',
    },
  })

  const values = watch()

  const onSubmit = async (data: BroadcastForm) => {
    setSending(true)
    try {
      await onSend(data)
      reset()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <Tabs defaultValue="compose" onValueChange={(v) => setPreview(v === 'preview')}>
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="title">Notification Title *</Label>
              <Input
                id="title"
                {...register('title')}
                className={cn(errors.title && 'border-red-500')}
                placeholder="e.g. Event Reminder"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                {...register('message')}
                className={cn(errors.message && 'border-red-500')}
                rows={5}
                placeholder="Type your notification message..."
              />
              {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Select
                  value={values.target}
                  onValueChange={(v) => setValue('target', v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5" /> All Users
                      </span>
                    </SelectItem>
                    <SelectItem value="members">All Members</SelectItem>
                    <SelectItem value="club_admins">Club Admins</SelectItem>
                    <SelectItem value="district_admin">District Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select
                  value={values.channel}
                  onValueChange={(v) => setValue('channel', v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-App Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {values.target === 'members' && clubs.length > 0 && (
              <div className="space-y-1.5">
                <Label>Specific Club (optional)</Label>
                <Select
                  value={values.club_id || ''}
                  onValueChange={(v) => setValue('club_id', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All clubs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Clubs</SelectItem>
                    {clubs.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <div className="rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-cranberry p-2">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy">
                  {values.title || 'Notification Title'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {values.message || 'Your message will appear here...'}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span>To: {values.target.replace('_', ' ')}</span>
                  <span>Via: {values.channel}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
