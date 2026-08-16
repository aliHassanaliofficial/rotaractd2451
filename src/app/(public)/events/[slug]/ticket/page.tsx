'use client'

import { useState, useEffect, use, useRef } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatEventDateRange } from '@/lib/utils/date'
import { Calendar, MapPin, Download, Share2, ArrowLeft, Ticket, Loader2, FileDown, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Registration } from '@/types/database'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ id?: string }>
}

export default function TicketPage({ params, searchParams }: Props) {
  const { slug } = use(params)
  const { id: regId } = use(searchParams)
  const router = useRouter()
  const ticketRef = useRef<HTMLDivElement>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<'png' | 'pdf' | null>(null)

  useEffect(() => {
    if (!regId) {
      setLoading(false)
      return
    }
    async function load() {
      try {
        const res = await fetch(`/api/registrations/${regId}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setRegistration(data)
      } catch {
        setRegistration(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [regId])

  const downloadPNG = async () => {
    if (!ticketRef.current) return
    setDownloading('png')
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `ticket-${registration?.ticket_number || regId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Ticket downloaded as PNG')
    } catch {
      toast.error('Failed to download ticket')
    } finally {
      setDownloading(null)
    }
  }

  const downloadPDF = async () => {
    if (!ticketRef.current) return
    setDownloading('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`ticket-${registration?.ticket_number || regId}.pdf`)
      toast.success('Ticket downloaded as PDF')
    } catch {
      toast.error('Failed to download PDF')
    } finally {
      setDownloading(null)
    }
  }

  const shareWhatsApp = () => {
    if (!registration?.event) return
    const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rotaractd2451.org'}/events/${slug}`
    const text = `I'm attending ${registration.event.title}! Here's my ticket.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + eventUrl)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  if (!regId || !registration) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Ticket className="h-16 w-16 text-gray-300" />
        <h2 className="text-2xl font-bold text-navy">Ticket Not Found</h2>
        <p className="text-gray-500">No registration ID provided or ticket not found.</p>
        <Button variant="outline" asChild>
          <Link href={`/events/${slug}`}>Back to Event</Link>
        </Button>
      </div>
    )
  }

  const event = registration.event!
  const attendeeName = registration.profile?.full_name || registration.guest_name || 'Attendee'
  const attendeeEmail = registration.profile?.email || registration.guest_email || ''

  return (
    <div className="flex flex-col items-center py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/events/${slug}`} className="flex items-center gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Event
            </Link>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          ref={ticketRef}
          className="overflow-hidden rounded-2xl border-2 border-gold/30 bg-white shadow-2xl"
        >
          <div className="bg-gradient-to-r from-navy via-navy to-cranberry p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="Rotaract" width={120} height={36} className="h-9 object-contain" />
                  <div>
                    <p className="text-sm font-semibold text-gold">Entry Ticket</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {registration.status.toUpperCase()}
                </Badge>
              </div>
            </div>

          <div className="grid gap-6 p-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="mb-1 text-2xl font-bold text-navy">{event.title}</h2>
                <p className="text-sm text-gray-500">{formatEventDateRange(event.start_at, event.end_at)}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Attendee</p>
                  <p className="mt-1 font-semibold text-navy">{attendeeName}</p>
                  {attendeeEmail && <p className="text-sm text-gray-500">{attendeeEmail}</p>}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Ticket #</p>
                  <p className="mt-1 font-semibold text-navy">{registration.ticket_number || regId?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 text-gold" />
                  <span>{event.location}</span>
                </div>
              )}

              {registration.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Notes</p>
                  <p className="mt-1 text-sm text-gray-600">{registration.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center border-l border-dashed border-gray-200 pl-6 max-md:border-l-0 max-md:border-t max-md:pl-0 max-md:pt-6">
              <div className="rounded-2xl bg-white p-3 shadow-inner">
                <QRCodeSVG
                  value={registration.qr_code || JSON.stringify({ id: regId, ticket: registration.ticket_number })}
                  size={140}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">Scan at entry</p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 bg-gray-50 px-8 py-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Registered: {formatDate(registration.registered_at)}</span>
              <span>{registration.checked_in_at ? `Checked in: ${formatDate(registration.checked_in_at)}` : 'Not checked in'}</span>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={downloadPNG} disabled={downloading === 'png'} className="bg-gradient-to-br from-navy to-cranberry text-white hover:brightness-110">
            {downloading === 'png' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1 h-4 w-4" />}
            Download PNG
          </Button>
          <Button onClick={downloadPDF} disabled={downloading === 'pdf'} className="bg-cranberry text-white hover:bg-cranberry/90">
            {downloading === 'pdf' ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />}
            Download PDF
          </Button>
          <Button variant="outline" onClick={shareWhatsApp}>
            <Share2 className="mr-1 h-4 w-4" />
            Share via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}
