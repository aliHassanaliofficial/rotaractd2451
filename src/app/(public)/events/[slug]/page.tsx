'use client'

import { useState, useEffect, use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatEventDateRange, daysUntil, formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Calendar, MapPin, Clock, Users, Ticket, DollarSign, Globe, Loader2, CheckCircle, Share2, LinkIcon, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { SITE_URL } from '@/lib/constants'
import PaymentSection, { type SelectedPayment } from '@/components/events/PaymentSection'
import type { Event } from '@/types/database'

const guestSchema = z.object({
  guest_name: z.string().min(2, 'Name is required'),
  guest_email: z.string().email('Valid email is required'),
  guest_phone: z.string().optional(),
  guest_club: z.string().optional(),
  notes: z.string().optional(),
})

type GuestForm = z.infer<typeof guestSchema>

interface Props {
  params: Promise<{ slug: string }>
}

export default function EventDetailPage({ params }: Props) {
  const { slug } = use(params)
  const { user, loading: authLoading } = useAuth()
  const { settings } = useSiteSettings()
  const siteRegOpen = settings.feature_flags?.registration_open !== false
  const [event, setEvent] = useState<(Event & { host_club: any; organizer: any; registered_count?: number }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [payment, setPayment] = useState<SelectedPayment | null>(null)
  const [registrationType, setRegistrationType] = useState<'guest' | 'member'>('guest')
  const [showAgenda, setShowAgenda] = useState<string[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/slug/${slug}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setEvent(data)
      } catch {
        setEvent(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const onSubmit = async (data: GuestForm) => {
    if (!event) return
    if (needsPayment && !payment) {
      toast.error('Please complete the payment method and proof fields first.')
      return
    }
    setRegistering(true)
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ...data,
          ...(needsPayment ? { transaction_method_id: payment?.methodId, transaction_proof_url: payment?.proofUrl } : {}),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Registration failed')
      setRegistered(true)
      setPendingApproval(result.status === 'pending')
      setPayment(null)
      reset()
      toast.success(result.status === 'pending' ? 'Registration received! Awaiting payment approval.' : 'Successfully registered!')
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed. Please try again.')
      console.error('Guest registration error:', err)
    } finally {
      setRegistering(false)
    }
  }

  const handleMemberRegister = async () => {
    if (!event) return
    if (needsPayment && !payment) {
      toast.error('Please complete the payment method and proof fields first.')
      return
    }
    setRegistering(true)
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ...(needsPayment ? { transaction_method_id: payment?.methodId, transaction_proof_url: payment?.proofUrl } : {}),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Registration failed')
      setRegistered(true)
      setPendingApproval(result.status === 'pending')
      setPayment(null)
      toast.success(result.status === 'pending' ? 'Registration received! Awaiting payment approval.' : 'Successfully registered!')
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  if (!event) return notFound()

  const needsPayment = event.price > 0
  const countdown = daysUntil(event.start_at)
  const registeredCount = event?.registered_count || 0
  const capacityPercent = event.capacity ? Math.min(100, Math.round(registeredCount / (event.capacity || 1) * 100)) : 0
  const eventUrl = `${SITE_URL}/events/${slug}`

  function renderDescription(text: string) {
    const urlRegex = /(https?:\/\/[^\s<]+)/g
    const parts = text.split(urlRegex)
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cranberry underline underline-offset-2 hover:text-navy">{part}</a>
      }
      return part
    })
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[50vh] min-h-[350px] overflow-hidden">
        {event.cover_url ? (
          <Image src={event.cover_url} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-cranberry" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {event.event_type === 'conference' && <Badge variant="cranberry">Conference</Badge>}
              {event.category && <Badge variant="secondary">{event.category}</Badge>}
              {event.is_online && <Badge variant="info">Online</Badge>}
              <Badge variant={countdown > 7 ? 'success' : countdown > 0 ? 'warning' : 'destructive'}>
                {countdown > 0 ? `${countdown} days away` : countdown === 0 ? 'Today' : 'Past'}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">{event.title}</h1>
            <p className="mt-2 text-lg text-white/80">{formatEventDateRange(event.start_at, event.end_at)}</p>
          </div>
        </div>
      </div>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {event.description && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-navy">About This Event</h2>
                  <p className="leading-relaxed text-gray-600 whitespace-pre-line">{renderDescription(event.description)}</p>
                </div>
              )}

              {event.agenda && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-navy">Agenda</h2>
                  <div className="space-y-2">
                    {(Array.isArray(event.agenda) ? event.agenda : event.agenda.items || []).map((item: any, i: number) => (
                      <div key={i} className="rounded-2xl border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-navy">{item.title || item.time}</p>
                            {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
                          </div>
                          {item.time && <span className="shrink-0 text-sm text-gold font-medium">{item.time}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.rich_description && typeof event.rich_description === 'object' && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-navy">Details</h2>
                  <div className="prose prose-gray max-w-none leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={event.rich_description.__html ? { __html: event.rich_description.__html } : undefined}
                  />
                </div>
              )}

              {event.registration_open && !siteRegOpen && !registered && (
                <Card className="border-amber-300 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-navy">Registration Closed</CardTitle>
                    <CardDescription>
                      Registration is currently closed by the district. Please check back later.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {event.registration_open && siteRegOpen && !registered && !authLoading && (
                <Card className="border-cranberry/20">
                  <CardHeader>
                    <CardTitle className="text-navy">Register for this Event</CardTitle>
                    <CardDescription>
                      {!user
                        ? 'Sign in or fill in your details to register.'
                        : 'Register as a member or as a guest.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.registration_type === 'members_only' && !user ? (
                      <div className="space-y-4 text-center py-4">
                        <p className="text-sm text-gray-500">
                          This event is for Rotaractors only. Sign in to register.
                        </p>
                        <Button asChild className="bg-gradient-to-r from-navy to-rotary-blue text-white">
                          <Link href={`/login?redirect=/events/${slug}`}>Sign In to Register</Link>
                        </Button>
                      </div>
                    ) : event.registration_type === 'members_only' && user ? (
                      <div className="space-y-4 text-center py-4">
                        <p className="text-sm text-gray-500">
                          Register using your Rotaract account.
                        </p>
                        {needsPayment && (
                          <div className="rounded-2xl border bg-white p-4 text-left">
                            <PaymentSection price={event.price} currency={event.currency} onChange={setPayment} />
                          </div>
                        )}
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
                    ) : (
                      <Tabs value={registrationType} onValueChange={(v) => setRegistrationType(v as 'guest' | 'member')}>
                        <TabsList className="mb-4">
                          <TabsTrigger value="guest">Guest Registration</TabsTrigger>
                          {user && <TabsTrigger value="member">Member Registration</TabsTrigger>}
                        </TabsList>

                        <TabsContent value="guest">
                          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                                <Input {...register('guest_name')} placeholder="Your full name" />
                                {errors.guest_name && <p className="mt-1 text-xs text-cranberry">{errors.guest_name.message}</p>}
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                                <Input type="email" {...register('guest_email')} placeholder="your@email.com" />
                                {errors.guest_email && <p className="mt-1 text-xs text-cranberry">{errors.guest_email.message}</p>}
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                                <Input {...register('guest_phone')} placeholder="Phone number" />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Club (if any)</label>
                                <Input {...register('guest_club')} placeholder="Your Rotaract club" />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                              <Textarea {...register('notes')} placeholder="Any special requirements?" />
                            </div>
                            {needsPayment && (
                              <div className="rounded-2xl border bg-white p-4">
                                <PaymentSection price={event.price} currency={event.currency} onChange={setPayment} />
                              </div>
                            )}
                            <Button type="submit" className="bg-cranberry text-white hover:bg-cranberry/90" disabled={isSubmitting || registering}>
                              {isSubmitting || registering ? (
                                <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Registering...</>
                              ) : (
                                <><Ticket className="mr-1 h-4 w-4" /> Register Now</>
                              )}
                            </Button>
                          </form>
                        </TabsContent>

                        <TabsContent value="member">
                          <div className="space-y-4 text-center py-4">
                            <p className="text-sm text-gray-500">
                              Register using your Rotaract account.
                            </p>
                            {needsPayment && (
                              <div className="rounded-2xl border bg-white p-4 text-left">
                                <PaymentSection price={event.price} currency={event.currency} onChange={setPayment} />
                              </div>
                            )}
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
                  </CardContent>
                </Card>
              )}

              {registered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50 py-12 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  {pendingApproval ? (
                    <>
                      <h3 className="mb-2 text-xl font-semibold text-navy">Registration Received!</h3>
                      <p className="mb-6 max-w-md text-gray-500">
                        Your payment is being reviewed by our team. You will receive your confirmation and e-ticket by email once it is approved.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mb-2 text-xl font-semibold text-navy">You&apos;re Registered!</h3>
                      <p className="mb-6 text-gray-500">Check your email for the confirmation and ticket.</p>
                    </>
                  )}
                  <Button variant="outline" onClick={() => { setRegistered(false); setPendingApproval(false) }}>Register Another Person</Button>
                </motion.div>
              )}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-navy">Event Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-sm font-medium text-navy">Date & Time</p>
                      <p className="text-sm text-gray-500">{formatEventDateRange(event.start_at, event.end_at)}</p>
                    </div>
                  </div>
                  <Separator />
                  {event.location && (
                    <>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                        <div>
                          <p className="text-sm font-medium text-navy">Location</p>
                          <p className="text-sm text-gray-500">{event.location}</p>
                          {event.location_url && (
                            <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cranberry hover:underline">View on map</a>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                  {event.is_online && event.online_url && (
                    <>
                      <div className="flex items-start gap-3">
                        <Globe className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                        <div>
                          <p className="text-sm font-medium text-navy">Online Link</p>
                          <a href={event.online_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cranberry hover:underline">Join online</a>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                  {event.price > 0 && (
                    <>
                      <div className="flex items-start gap-3">
                        <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                        <div>
                          <p className="text-sm font-medium text-navy">Price</p>
                          <p className="text-sm text-gray-500">{event.price} {event.currency}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                  {event.registration_deadline && (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                      <div>
                        <p className="text-sm font-medium text-navy">Registration Deadline</p>
                        <p className="text-sm text-gray-500">{formatDate(event.registration_deadline)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {event.capacity && event.show_capacity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-navy">Capacity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-500">{registeredCount} / {event.capacity} registered</span>
                      <span className="font-medium text-navy">{event.capacity - registeredCount > 0 ? event.capacity - registeredCount : 0} spots left</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          capacityPercent >= 100 ? 'bg-red-500' : capacityPercent > 80 ? 'bg-cranberry' : capacityPercent > 50 ? 'bg-gold' : 'bg-green-500'
                        )}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                    {capacityPercent >= 100 && (
                      <p className="mt-2 text-sm font-medium text-red-500">Sold Out</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {event.host_club && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-navy">Host Club</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/clubs/${event.host_club.slug}`} className="flex items-center gap-3 group">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-navy to-cranberry text-gold font-bold">
                        {event.host_club.logo_url ? (
                          <Image src={event.host_club.logo_url} alt={event.host_club.name} width={48} height={48} className="rounded-full object-cover" />
                        ) : (
                          event.host_club.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-navy group-hover:text-cranberry">{event.host_club.name}</p>
                        <p className="text-xs text-gray-400">{event.host_club.city || event.host_club.university}</p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {event.sponsors && Array.isArray(event.sponsors) && event.sponsors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-navy">Sponsors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {event.sponsors.map((s: any, i: number) => (
                        <div key={i} className="rounded-2xl border px-3 py-2 text-sm text-gray-600">
                          {s.name || s}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-navy">Share</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${event.title} ${eventUrl}`)}`, '_blank')}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank')}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => { navigator.clipboard.writeText(eventUrl); toast.success('Link copied!') }}>
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
