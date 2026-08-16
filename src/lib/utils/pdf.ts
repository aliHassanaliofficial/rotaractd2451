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

export async function generateTicketPDF(registration: RegistrationData, event: EventData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })

  const gold: [number, number, number] = [247, 168, 27]
  const navy: [number, number, number] = [0, 56, 101]

  doc.setFillColor(...navy)
  doc.rect(0, 0, 148, 20, 'F')

  doc.setTextColor(255, 215, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ROTARACT DISTRICT 2451', 74, 13, { align: 'center' })

  doc.setTextColor(...navy)
  doc.setFontSize(18)
  doc.text(event.title, 74, 35, { align: 'center', maxWidth: 130 })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`\u{1F4C5} ${format(new Date(event.start_at), 'EEEE, MMMM d, yyyy • h:mm a')}`, 20, 50)
  doc.text(`\u{1F4CD} ${event.location || 'Online'}`, 20, 57)

  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  doc.line(15, 63, 133, 63)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...navy)
  const name = registration.profile?.full_name || registration.guest_name || 'Attendee'
  doc.text(name, 74, 73, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`Ticket: ${registration.ticket_number || 'N/A'}`, 74, 80, { align: 'center' })
  const clubName = registration.profile?.club?.name || registration.guest_club || 'Guest'
  doc.text(`Club: ${clubName}`, 74, 86, { align: 'center' })

  const qrPayload = JSON.stringify({
    id: registration.id,
    ticket: registration.ticket_number,
    event: event.title,
  })
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 200, margin: 1 })
  doc.addImage(qrDataUrl, 'PNG', 44, 93, 60, 60)

  doc.setFillColor(245, 245, 245)
  doc.rect(0, 185, 148, 25, 'F')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('This ticket is non-transferable. Please present at entrance.', 74, 195, { align: 'center' })
  doc.text('Valid photo ID may be required.', 74, 201, { align: 'center' })

  return doc.output('blob')
}
