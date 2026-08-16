'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/providers/AuthProvider'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Globe,
  Users,
  Loader2,
  CheckCircle,
  Ticket,
  Pencil,
  ListChecks,
  Eye,
  EyeOff,
  MessageCircle,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatEventDateRange, formatDate } from '@/lib/utils/date'
import { getCalendarTypeColors } from '@/lib/constants'
import type { Event } from '@/types/database'

export type CalendarEventItem = Event & {
  host_club?: { name?: string; slug?: string; city?: string; university?: string } | null
}

export type CalendarMode = 'public' | 'admin' | 'club_admin'

const guestSchema = z.object({
  guest_name: z.string().min(2, 'Name is required'),
  guest_email: z.string().email('Valid email is required'),
  guest_phone: z.string().optional(),
  guest_club: z.string().optional(),
  notes: z.string().optional(),
})

type GuestForm = z.infer<typeof guestSchema>

interface EventDetailDialogProps {
  event: CalendarEventItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: CalendarMode
  onStatusToggle?: () => void
}

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  mode = 'public',
  onStatusToggle,
}: EventDetailDialogProps) {
  const { user, loading: authLoading } = useAuth()
  const { settings } = useSiteSettings()
  const siteRegOpen = settings.feature_flags?.registration_open !== false
  const [registered, setRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [regType, setRegType] = useState<'guest' | 'member'>('guest')
  const [toggling, setToggling] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GuestForm>({ resolver: zodResolver(guestSchema) })

  function handleOpenChange(next: boolean) {
    if (!next) {
      setRegistered(false)
      setRegType('guest')
      reset()
    }
    onOpenChange(next)
  }

  if (!event) return null

  const colors = getCalendarTypeColors(event.calendar_type)
  const deadlinePassed =
    !!event.registration_deadline && new Date(event.registration_deadline) < new Date()
  const canRegister =
    !!event &&
    event.status === 'published' &&
    event.registration_open &&
    siteRegOpen &&
    !deadlinePassed

  const isAdmin = mode === 'admin'
  const isClubAdmin = mode === 'club_admin'

  async function submitRegistration(data: GuestForm) {
    if (!event) return
    setRegistering(true)
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, ...data }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Registration failed')
      setRegistered(true)
      reset()
      toast.success('Successfully registered! Check your email for your ticket.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      toast.error(message)
      console.error('Calendar registration error:', err)
    } finally {
      setRegistering(false)
    }
  }

  async function handleMemberRegister() {
    if (!event) return
    setRegistering(true)
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Registration failed')
      setRegistered(true)
      toast.success('Successfully registered! Check your email for your ticket.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      toast.error(message)
      console.error('Calendar member registration error:', err)
    } finally {
      setRegistering(false)
    }
  }

  async function toggleStatus() {
    if (!event) return
    setToggling(true)
    try {
      const next = event.status === 'published' ? 'draft' : 'published'
      const { error } = await supabase
        .from('events')
        .update({ status: next })
        .eq('id', event.id)
      if (error) throw error
      toast.success(next === 'published' ? 'Entry published' : 'Entry hidden')
      onStatusToggle?.()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setToggling(false)
    }
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rotaractd2451.org'}/events/${event.slug}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{event.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Event details and registration for {event.title}
          </DialogDescription>
        </DialogHeader>

        {event.cover_url && (
          <div className="relative -mx-6 -mt-6 h-44 overflow-hidden rounded-t-2xl">
            <Image src={event.cover_url} alt={event.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {colors.label}
          </span>
          {event.category && <Badge variant="outline" className="text-xs">{event.category}</Badge>}
          {event.is_online && <Badge variant="info">Online</Badge>}
          {event.status !== 'published' && (
            <Badge variant="warning">{event.status}</Badge>
          )}
        </div>

        <h3 className="text-2xl font-bold text-navy">{event.title}</h3>

        {event.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {event.description}
          </p>
        )}

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarIcon className="mt-0.5 h-5 w-5 shrink-0 text-cranberry" />
            <div>
              <p className="text-sm font-medium text-navy">Date & Time</p>
              <p className="text-sm text-gray-500">{formatEventDateRange(event.start_at, event.end_at)}</p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cranberry" />
              <div>
                <p className="text-sm font-medium text-navy">Location</p>
                <p className="text-sm text-gray-500">{event.location}</p>
                {event.location_url && (
                  <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cranberry hover:underline">
                    View on map
                  </a>
                )}
              </div>
            </div>
          )}

          {event.is_online && event.online_url && (
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-5 w-5 shrink-0 text-cranberry" />
              <div>
                <p className="text-sm font-medium text-navy">Online Link</p>
                <a href={event.online_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cranberry hover:underline">
                  Join online
                </a>
              </div>
            </div>
          )}

          {event.capacity && (
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-cranberry" />
              <div>
                <p className="text-sm font-medium text-navy">Maximum Attendees</p>
                <p className="text-sm text-gray-500">{event.capacity} spots</p>
              </div>
            </div>
          )}

          {event.registration_deadline && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-cranberry" />
              <div>
                <p className="text-sm font-medium text-navy">Registration Deadline</p>
                <p className="text-sm text-gray-500">{formatDate(event.registration_deadline)}</p>
              </div>
            </div>
          )}
        </div>

        {event.host_club?.name && (
          <div className="text-sm text-gray-500">
            Hosted by <span className="font-medium text-navy">{event.host_club.name}</span>
          </div>
        )}

        {canRegister && !registered && (
          <div className="rounded-2xl border border-cranberry/20 bg-cranberry/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-cranberry" />
              <h4 className="text-sm font-semibold text-navy">Register for this event</h4>
            </div>

            {event.registration_type === 'members_only' && !user ? (
              <div className="space-y-3 py-2 text-center">
                <p className="text-sm text-gray-500">
                  This event is for Rotaractors only. Sign in to register.
                </p>
                <Button asChild className="bg-gradient-to-r from-navy to-rotary-blue text-white">
                  <Link href={`/login?redirect=/calendar`}>Sign In to Register</Link>
                </Button>
              </div>
            ) : event.registration_type === 'members_only' && user ? (
              <div className="space-y-3 py-2 text-center">
                <p className="text-sm text-gray-500">Register using your Rotaract account.</p>
                <Button
                  className="bg-gradient-to-r from-navy to-rotary-blue text-white hover:brightness-110"
                  onClick={handleMemberRegister}
                  disabled={registering || authLoading}
                >
                  {registering ? (
                    <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Registering...</>
                  ) : (
                    <><Ticket className="mr-1 h-4 w-4" /> Register as Member</>
                  )}
                </Button>
              </div>
            ) : (
              <Tabs value={regType} onValueChange={(v) => setRegType(v as 'guest' | 'member')}>
                <TabsList className="mb-3">
                  <TabsTrigger value="guest">Guest Registration</TabsTrigger>
                  {user && <TabsTrigger value="member">Member Registration</TabsTrigger>}
                </TabsList>

                <TabsContent value="guest">
                  <form onSubmit={handleSubmit(submitRegistration)} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Full Name *</Label>
                        <Input {...register('guest_name')} placeholder="Your full name" />
                        {errors.guest_name && <p className="mt-1 text-xs text-cranberry">{errors.guest_name.message}</p>}
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input type="email" {...register('guest_email')} placeholder="your@email.com" />
                        {errors.guest_email && <p className="mt-1 text-xs text-cranberry">{errors.guest_email.message}</p>}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Phone</Label>
                        <Input type="tel" {...register('guest_phone')} placeholder="Phone number" />
                      </div>
                      <div>
                        <Label>Rotaract Club</Label>
                        <Input {...register('guest_club')} placeholder="Your Rotaract club (optional)" />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea {...register('notes')} rows={2} placeholder="Any special requirements or questions..." />
                    </div>
                    <Button type="submit" className="w-full bg-cranberry text-white hover:bg-cranberry/90" disabled={registering}>
                      {registering ? (
                        <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Registering...</>
                      ) : (
                        <><Ticket className="mr-1 h-4 w-4" /> Register Now</>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="member">
                  <div className="space-y-3 py-2 text-center">
                    <p className="text-sm text-gray-500">Register using your Rotaract account.</p>
                    <Button
                      className="bg-gradient-to-r from-navy to-rotary-blue text-white hover:brightness-110"
                      onClick={handleMemberRegister}
                      disabled={registering}
                    >
                      {registering ? (
                        <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Registering...</>
                      ) : (
                        <><Ticket className="mr-1 h-4 w-4" /> Register as Member</>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        {registered && (
          <div className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50 py-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-base font-semibold text-navy">You&apos;re Registered!</h4>
            <p className="mt-1 text-sm text-gray-500">Check your email for the confirmation and ticket.</p>
          </div>
        )}

        {(isAdmin || isClubAdmin) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-navy">Admin Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={isAdmin ? `/admin/events/${event.id}/edit` : `/club-admin/events/${event.id}/edit`}>
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Link>
                </Button>
                {isAdmin && (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/events/${event.id}/registrations`}>
                        <ListChecks className="mr-1 h-4 w-4" /> Registrations
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={toggleStatus} disabled={toggling}>
                      {toggling ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : event.status === 'published' ? (
                        <EyeOff className="mr-1 h-4 w-4" />
                      ) : (
                        <Eye className="mr-1 h-4 w-4" />
                      )}
                      {event.status === 'published' ? 'Hide' : 'Publish'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full p-0"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${event.title} ${eventUrl}`)}`, '_blank')}
            title="Share on WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full p-0"
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank')}
            title="Share on Facebook"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href={`/events/${event.slug}`}>View full page</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
