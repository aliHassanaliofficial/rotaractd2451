'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { getUserRegistrations } from '@/lib/supabase/queries/registrations'
import { generateTicketPDF } from '@/lib/utils/pdf'
import { formatDateTime } from '@/lib/utils/date'
import { REG_STATUS_LABELS, REG_STATUS_COLORS } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Loader2,
  Ticket,
  Download,
  XCircle,
  Calendar,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Registration } from '@/types/database'

export default function MyTicketsPage() {
  const { user, loading: userLoading } = useUser()
  const [registrations, setRegistrations] = useState<(Registration & { event: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getUserRegistrations(user.id)
      .then(setRegistrations)
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false))
  }, [user])

  const handleDownload = async (reg: Registration & { event: any }) => {
    setDownloading(reg.id)
    try {
      const blob = await generateTicketPDF(reg, reg.event)
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `ticket-${reg.ticket_number || reg.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Ticket downloaded')
    } catch {
      toast.error('Failed to download ticket')
    } finally {
      setDownloading(null)
    }
  }

  const handleCancel = async (regId: string) => {
    setCancelling(regId)
    setCancelDialog(null)
    try {
      const res = await fetch(`/api/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel')
      }
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId ? { ...r, status: 'cancelled' as const } : r
        )
      )
      toast.success('Registration cancelled')
    } catch {
      toast.error('Failed to cancel registration')
    } finally {
      setCancelling(null)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
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
      <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-gray-500">Please sign in to view your tickets.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <Ticket className="h-7 w-7 text-cranberry" />
          <h1 className="text-3xl font-bold text-navy">My Tickets</h1>
        </div>

        {registrations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Ticket className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">
                No tickets yet
              </p>
              <p className="mb-4 text-sm text-gray-400">
                Register for an event to get your ticket
              </p>
              <Button asChild>
                <a href="/events">Browse Events</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg, index) => (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="flex items-center justify-center border-b bg-gray-50 p-4 sm:w-32 sm:border-b-0 sm:border-r">
                        {reg.qr_code ? (
                          <QRCodeSVG
                            value={reg.qr_code}
                            size={96}
                            bgColor="#ffffff"
                            fgColor="#003865"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gray-200">
                            <Ticket className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4 sm:p-6">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-navy">
                              {reg.event?.title || 'Event'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {reg.event?.start_at
                                ? formatDateTime(reg.event.start_at)
                                : ''}
                            </p>
                          </div>
                          <Badge
                            className={
                              REG_STATUS_COLORS[reg.status] || 'bg-gray-100'
                            }
                          >
                            {REG_STATUS_LABELS[reg.status] || reg.status}
                          </Badge>
                        </div>

                        {reg.event?.location && (
                          <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />
                            {reg.event.location}
                          </div>
                        )}

                        <div className="mt-1 text-xs text-gray-400">
                          Ticket: {reg.ticket_number || 'N/A'}
                          {reg.registered_at && (
                            <>
                              {' • '}
                              Registered{' '}
                              {formatDateTime(reg.registered_at)}
                            </>
                          )}
                        </div>

                        {reg.status !== 'cancelled' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(reg)}
                              disabled={downloading === reg.id}
                            >
                              {downloading === reg.id ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="mr-1 h-3.5 w-3.5" />
                              )}
                              Download PDF
                            </Button>
                            <Dialog
                              open={cancelDialog === reg.id}
                              onOpenChange={(open) =>
                                setCancelDialog(open ? reg.id : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700"
                                  disabled={cancelling === reg.id}
                                >
                                  {cancelling === reg.id ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  Cancel
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Cancel Registration
                                  </DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to cancel your
                                    registration for{' '}
                                    <strong>{reg.event?.title}</strong>?
                                    This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setCancelDialog(null)}
                                  >
                                    Keep Registration
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleCancel(reg.id)}
                                  >
                                    Yes, Cancel
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}

                        {reg.event && reg.status !== 'cancelled' && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="link"
                              className="h-auto p-0 text-xs"
                              asChild
                            >
                              <a href={`/events/${reg.event.slug}`}>
                                <ExternalLink className="mr-1 h-3 w-3" />
                                View Event Details
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
