'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EVENT_CATEGORIES } from '@/lib/constants'
import Link from 'next/link'

export default function ClubAdminEditEventPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [category, setCategory] = useState('')
  const [calendarType, setCalendarType] = useState<'event' | 'project' | 'meeting'>('event')
  const supabase = createClient()

  useEffect(() => {
    loadEvent()
  }, [id])

  async function loadEvent() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) { toast.error('Event not found'); return }
      setTitle(data.title || '')
      setDescription(data.description || '')
      setStartAt(data.start_at ? new Date(data.start_at).toISOString().slice(0, 16) : '')
      setEndAt(data.end_at ? new Date(data.end_at).toISOString().slice(0, 16) : '')
      setLocation(data.location || '')
      setCapacity(data.capacity?.toString() || '')
      setCategory(data.category || '')
      setCalendarType(data.calendar_type || 'event')
    } catch {
      toast.error('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!startAt || !endAt) { toast.error('Start and end dates are required'); return }

    setIsSubmitting(true)
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'

      const { error } = await supabase
        .from('events')
        .update({
          title,
          slug,
          description: description || null,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          location: location || null,
          capacity: capacity ? parseInt(capacity) : null,
          category: category || null,
          calendar_type: calendarType,
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Event updated')
      router.push('/club-admin/events')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update event')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/club-admin/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">Edit Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_at">Start Date & Time</Label>
                <Input id="start_at" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_at">End Date & Time</Label>
                <Input id="end_at" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Calendar Type</Label>
                <Select value={calendarType} onValueChange={(v) => setCalendarType(v as 'event' | 'project' | 'meeting')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/club-admin/events">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
