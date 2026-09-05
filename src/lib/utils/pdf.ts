import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { format } from 'date-fns'

interface RegistrationData {
  id: string
  ticket_number?: string
  guest_name?: string
  guest_club?: string
  profile?: { full_name?: string; club?: { name?: string } }
}

interface EventData {
  title: string
  start_at: string
  location?: string
}

export interface TicketBranding {
  districtName?: string
  logoUrl?: string
  siteUrl?: string
}

async function resolveLogoDataUrl(branding: TicketBranding): Promise<string | null> {
  const raw = branding.logoUrl || '/logo-white.png'
  try {
    const url = raw.startsWith('http') ? raw : raw.startsWith('/') ? `${branding.siteUrl || ''}${raw}` : raw
    if (!url) return null
    const res = await fetch(url)
    if (!res.ok) return null
    const arr = new Uint8Array(await res.arrayBuffer())
    let bin = ''
    for (const b of arr) bin += String.fromCharCode(b)
    const base64 = btoa(bin)
    const mime = res.headers.get('content-type') || 'image/png'
    return `data:${mime};base64,${base64}`
  } catch {
    return null
  }
}

function readPngSize(dataUrl: string): { width: number; height: number } | null {
  try {
    const comma = dataUrl.indexOf(',')
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
    const bin = atob(b64)
    if (!bin.startsWith('\x89PNG\r\n\x1a\n') || bin.length < 24) return null
    const be32 = (o: number) =>
      (bin.charCodeAt(o) << 24) |
      (bin.charCodeAt(o + 1) << 16) |
      (bin.charCodeAt(o + 2) << 8) |
      bin.charCodeAt(o + 3)
    const width = be32(16)
    const height = be32(20)
    if (width > 0 && height > 0) return { width, height }
  } catch {}
  return null
}

export async function generateTicketPDF(registration: RegistrationData, event: EventData, branding: TicketBranding = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })

  const gold: [number, number, number] = [247, 168, 27]
  const navy: [number, number, number] = [0, 56, 101]

  const headerH = 28
  doc.setFillColor(...navy)
  doc.rect(0, 0, 148, headerH, 'F')

  const logoDataUrl = await resolveLogoDataUrl(branding)
  if (logoDataUrl) {
    try {
      const format = logoDataUrl.includes('image/jpeg')
        ? 'JPEG'
        : logoDataUrl.includes('image/webp')
          ? 'WEBP'
          : 'PNG'
      const size = readPngSize(logoDataUrl)
      const aspect = size ? size.width / size.height : 63 / 87
      const maxLogoH = 14
      const maxLogoW = 40
      let logoH = maxLogoH
      let logoW = logoH * aspect
      if (logoW > maxLogoW) {
        logoW = maxLogoW
        logoH = logoW / aspect
      }
      doc.addImage(logoDataUrl, format, (148 - logoW) / 2, 2, logoW, logoH)
    } catch {}
  }

  doc.setTextColor(255, 215, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(branding.districtName || 'ROTARACT DISTRICT 2451', 74, 21, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('OFFICIAL ENTRY TICKET', 74, 26, { align: 'center' })

  doc.setTextColor(...navy)
  doc.setFontSize(18)
  doc.text(event.title, 74, 43, { align: 'center', maxWidth: 130 })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(format(new Date(event.start_at), 'EEEE, MMMM d, yyyy • h:mm a'), 20, 58)
  doc.text(event.location || 'Online', 20, 65)

  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  doc.line(15, 71, 133, 71)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('ATTENDEE', 74, 78, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...navy)
  const rawName = registration.profile?.full_name || registration.guest_name
  const name = (rawName || '').trim() || 'Attendee'
  doc.text(name, 74, 85, { align: 'center', maxWidth: 130 })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`Ticket: ${registration.ticket_number || 'N/A'}`, 74, 92, { align: 'center' })
  const clubName = registration.profile?.club?.name || registration.guest_club || ''
  if (clubName) doc.text(`Club: ${clubName}`, 74, 98, { align: 'center' })

  const qrPayload = JSON.stringify({
    id: registration.id,
    ticket: registration.ticket_number,
    event: event.title,
  })
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 200, margin: 1 })
  doc.addImage(qrDataUrl, 'PNG', 44, 104, 60, 60)

  doc.setFillColor(245, 245, 245)
  doc.rect(0, 185, 148, 25, 'F')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('This ticket is non-transferable. Please present at entrance.', 74, 195, { align: 'center' })
  doc.text('Valid photo ID may be required.', 74, 201, { align: 'center' })

  return doc.output('blob')
}