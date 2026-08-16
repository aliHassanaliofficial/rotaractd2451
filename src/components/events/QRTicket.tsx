'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, MapPin, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatEventDateRange } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'

interface AttendeeInfo {
  name: string
  club?: string
  ticketNumber: string
}

interface EventInfo {
  title: string
  start_at: string
  end_at: string
  location?: string
}

interface QRTicketProps {
  event: EventInfo
  attendee: AttendeeInfo
  className?: string
  onDownload?: () => void
}

export function QRTicket({ event, attendee, className, onDownload }: QRTicketProps) {
  const qrData = JSON.stringify({
    ticket: attendee.ticketNumber,
    name: attendee.name,
    event: event.title,
  })

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-gold bg-white shadow-xl',
        className
      )}
    >
      <div className="bg-gradient-to-r from-navy via-[#0a4a82] to-rotary-blue px-6 py-4">
        <p className="text-sm font-bold tracking-wider text-gold">ROTARACT DISTRICT 2451</p>
      </div>

      <div className="space-y-4 p-6">
        <h3 className="text-xl font-bold text-navy">{event.title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            <span>{formatEventDateRange(event.start_at, event.end_at)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cranberry" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-200" />

        <div className="flex items-center gap-6">
          <div className="rounded-2xl border bg-white p-2">
            <QRCodeSVG value={qrData} size={100} level="M" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-navy">{attendee.name}</p>
            {attendee.club && <p className="text-sm text-gray-500">{attendee.club}</p>}
            <p className="text-xs text-gray-400">Ticket: {attendee.ticketNumber}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-3">
        <p className="text-center text-[10px] text-gray-400">
          This ticket is non-transferable. Please present at entrance.
        </p>
      </div>

      {onDownload && (
        <div className="absolute right-3 top-3">
          <Button variant="ghost" size="icon" onClick={onDownload} className="h-8 w-8 text-white hover:text-gold">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
