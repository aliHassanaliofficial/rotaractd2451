'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EVENT_CATEGORIES } from '@/lib/constants'
import Link from 'next/link'

export default function ClubAdminNewEventPage() {
  const router = useRouter()
  const { profile } = useUser()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!startAt || !endAt) { toast.error('Start and end dates are required'); return }
    if (!profile?.club_id) { toast.error('No club assigned'); return }

    setIsSubmitting(true)
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'

      const { error } = await supabase.from('events').insert({
        title,
        slug,
        description: description || null,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        location: location || null,
        capacity: capacity ? parseInt(capacity) : null,
        category: category || null,
        calendar_type: calendarType,
        status: 'draft',
        approval_status: 'pending',
        host_club_id: profile.club_id,
        organizer_id: profile.id,
        price: 0,
        currency: 'EGP',
        is_online: false,
        registration_open: true,
      })

      if (error) throw error
      toast.success('Event created and submitted for approval')
      router.push('/club-admin/events')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/club-admin/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-navy">New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the event..." />
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
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue name or address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Max attendees" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/club-admin/events">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create Event
          </Button>
        </div>
      </form>
    </div>
  )
}
