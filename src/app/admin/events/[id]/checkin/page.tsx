'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getEventById } from '@/lib/supabase/queries/events'
import { getRegistrationsByEvent, checkInAttendee, getRegistrationByQR } from '@/lib/supabase/queries/registrations'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { ArrowLeft, Search, Camera, UserCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Registration } from '@/types/database'

export default function CheckinPage() {
  const params = useParams()
  const id = params.id as string
  const [event, setEvent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<(Registration & { profile: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [scannedReg, setScannedReg] = useState<(Registration & { event: any; profile: any }) | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const videoRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const supabase = createClient()

  const checkedIn = registrations.filter((r) => r.status === 'attended').length
  const total = registrations.length

  useEffect(() => {
    async function load() {
      try {
        const [evt, regs] = await Promise.all([
          getEventById(id),
          getRegistrationsByEvent(id),
        ])
        setEvent(evt)
        setRegistrations(regs as any)
      } catch {
        toast.error('Failed to load check-in data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const playBeep = useCallback((type: 'success' | 'error') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      gain.gain.value = 0.3

      if (type === 'success') {
        osc.frequency.value = 880
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.15)
      } else {
        osc.frequency.value = 220
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch {
      // Audio not available
    }
  }, [])

  async function handleScan(qrCode: string) {
    playBeep('success')
    try {
      const reg = await getRegistrationByQR(qrCode)
      setScannedReg(reg)
      setScannerActive(false)
    } catch {
      playBeep('error')
      toast.error('Invalid QR code')
    }
  }

  async function handleManualSearch() {
    if (!manualCode.trim()) return
    setLoading(true)
    try {
      const reg = await getRegistrationByQR(manualCode.trim())
      setScannedReg(reg)
      playBeep('success')
    } catch {
      playBeep('error')
      toast.error('No registration found with that code')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn(regId: string) {
    setCheckingIn(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const updated = await checkInAttendee(regId, user?.id || '')
      if (!updated) {
        playBeep('error')
        toast.error('Only confirmed registrations can be checked in')
        return
      }
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId
            ? { ...r, status: 'attended', checked_in_at: new Date().toISOString(), checked_in_by: user?.id }
            : r
        )
      )
      setScannedReg(null)
      playBeep('success')
      toast.success('Checked in successfully')
    } catch {
      toast.error('Failed to check in')
    } finally {
      setCheckingIn(false)
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop() } catch {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [])

  if (loading && !event) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">Check-In</h1>
            <p className="text-sm text-gray-500">{event?.title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-navy">{checkedIn} / {total}</p>
          <p className="text-sm text-gray-500">Checked in</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <Camera className="h-5 w-5 text-cranberry" />
              QR Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={videoRef} className="mb-4 aspect-video rounded-2xl bg-gray-100 flex items-center justify-center">
              {scannerActive ? (
                <p className="text-gray-400">Scanner active (html5-qrcode)</p>
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">Start camera to scan QR codes</p>
                  <Button onClick={() => {
                    setScannerActive(true)
                    setScannerError('')
                  }}>
                    Start Scanner
                  </Button>
                  {scannerError && <p className="mt-2 text-xs text-red-500">{scannerError}</p>}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Manual Entry</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ticket number or QR code..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
                <Button variant="outline" onClick={handleManualSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Scanned Attendee</CardTitle>
          </CardHeader>
          <CardContent>
            {scannedReg ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={scannedReg.profile?.avatar_url} />
                    <AvatarFallback className="bg-cranberry/10 text-cranberry">
                      {(scannedReg.profile?.full_name || scannedReg.guest_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-navy text-lg">
                      {scannedReg.profile?.full_name || scannedReg.guest_name || 'Guest'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {scannedReg.profile?.email || scannedReg.guest_email || 'No email'}
                    </p>
                    {scannedReg.profile?.club?.name && (
                      <p className="text-xs text-gray-400">{scannedReg.profile.club.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    scannedReg.status === 'attended' ? 'bg-green-100 text-green-700' :
                    scannedReg.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    scannedReg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  )} variant="outline">
                    {scannedReg.status}
                  </Badge>
                  {scannedReg.ticket_number && (
                    <span className="text-xs text-gray-400">Ticket: {scannedReg.ticket_number}</span>
                  )}
                </div>

                {scannedReg.status === 'confirmed' ? (
                  <Button className="w-full" onClick={() => handleCheckIn(scannedReg.id)} disabled={checkingIn}>
                    {checkingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                    Mark as Attended
                  </Button>
                ) : scannedReg.status === 'attended' ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 p-3 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Already checked in {scannedReg.checked_in_at && `at ${formatDateTime(scannedReg.checked_in_at)}`}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 p-3 text-red-700">
                    <XCircle className="h-5 w-5" />
                    This ticket is {scannedReg.status} and cannot be checked in.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Camera className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Scan a QR code or enter a ticket number</p>
                <p className="text-xs text-gray-400 mt-1">Attendee info will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-navy">Recent Check-Ins</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Ticket</th>
                    <th className="px-6 py-3">Checked In At</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.filter((r) => r.status === 'attended').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No check-ins yet</td>
                    </tr>
                  ) : (
                    registrations
                      .filter((r) => r.status === 'attended')
                      .slice(0, 20)
                      .map((reg) => (
                        <tr key={reg.id} className="border-b">
                          <td className="px-6 py-3 font-medium text-navy">
                            {reg.profile?.full_name || reg.guest_name || 'Guest'}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{reg.ticket_number || '-'}</td>
                          <td className="px-6 py-3 text-gray-500 text-xs">
                            {reg.checked_in_at ? formatDateTime(reg.checked_in_at) : '-'}
                          </td>
                          <td className="px-6 py-3">
                            <Badge variant="outline" className="bg-green-100 text-green-700">Attended</Badge>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Label({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('text-sm font-medium', className)} {...props}>{children}</label>
}
