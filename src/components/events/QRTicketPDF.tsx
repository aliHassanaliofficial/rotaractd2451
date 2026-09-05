'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileDown } from 'lucide-react'
import { generateTicketPDF } from '@/lib/utils/pdf'
import { getDistrictInfo } from '@/lib/supabase/queries/settings'

interface QRTicketPDFProps {
  registration: {
    id: string
    ticket_number?: string
    guest_name?: string
    guest_club?: string
    profile?: { full_name?: string; club?: { name?: string } }
  }
  event: {
    title: string
    start_at: string
    location?: string
  }
  fileName?: string
}

export function QRTicketPDF({ registration, event, fileName = 'ticket.pdf' }: QRTicketPDFProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const districtInfo = (await getDistrictInfo()) || {}
      const blob = await generateTicketPDF(registration, event, {
        districtName: (districtInfo.name as string) || 'Rotaract District 2451',
        logoUrl: '/logo-white.png',
        siteUrl: window.location.origin,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      Download PDF Ticket
    </Button>
  )
}
