import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { guestRegistrationSchema } from '@/lib/validations/registration'
import { v4 as uuidv4 } from 'uuid'
import { getEventById } from '@/lib/supabase/queries/events'
import { getRegistrationCount } from '@/lib/supabase/queries/registrations'
import { sendEmail, getRegistrationConfirmationHtml, renderTemplate } from '@/lib/utils/email'
import { generateTicketPDF } from '@/lib/utils/pdf'
import { formatDate } from '@/lib/utils/date'
import type { Registration } from '@/types/database'

const ipRequests = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const window = 60000
  const maxRequests = 5
  const entry = ipRequests.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (event.status !== 'published') {
      return NextResponse.json({ error: 'Event is not open for registration' }, { status: 400 })
    }
    if (!event.registration_open) {
      return NextResponse.json({ error: 'Registration is closed for this event' }, { status: 400 })
    }
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 })
    }

    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['feature_flags', 'email_templates'])
    const settingsMap: Record<string, any> = {}
    for (const s of settingsData || []) {
      settingsMap[s.key] = s.value
    }
    const flags = settingsMap.feature_flags || {}
    if (flags.registration_open === false) {
      return NextResponse.json({ error: 'Registration is currently closed by the district' }, { status: 403 })
    }
    const templates = settingsMap.email_templates || {}

    if (event.capacity) {
      const currentCount = await getRegistrationCount(id)
      if (currentCount >= event.capacity) {
        return NextResponse.json({ error: 'Event has reached maximum capacity' }, { status: 400 })
      }
    }

    const body = await request.json()

    let guestData: {
      guest_name?: string
      guest_email?: string
      guest_phone?: string
      guest_club?: string
      notes?: string
    } = {}

    if (!user) {
      guestData = guestRegistrationSchema.parse({ ...body, event_id: id })
      if (!guestData.guest_name || !guestData.guest_email) {
        return NextResponse.json({ error: 'Guest name and email are required' }, { status: 400 })
      }
    }

    const qrCode = uuidv4()
    const ticketNumber = `R2451-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const registrationData = user
      ? {
          event_id: id,
          profile_id: user.id,
          qr_code: qrCode,
          ticket_number: ticketNumber,
          status: 'confirmed' as Registration['status'],
          notes: body.notes,
        }
      : {
          event_id: id,
          guest_name: guestData.guest_name,
          guest_email: guestData.guest_email,
          guest_phone: guestData.guest_phone,
          guest_club: guestData.guest_club,
          qr_code: qrCode,
          ticket_number: ticketNumber,
          status: 'confirmed' as Registration['status'],
          notes: guestData.notes,
        }

    const { data: registration, error } = await supabase
      .from('registrations')
      .insert(registrationData as any)
      .select('*, event:event_id(*), profile:profile_id(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to register: ' + error.message }, { status: 500 })
    }

    const emailAddress = user?.email || guestData.guest_email
    if (emailAddress) {
      try {
        const pdfBlob = await generateTicketPDF(
          { id: registration.id, ticket_number: ticketNumber, guest_name: guestData.guest_name, profile: user ? { full_name: user.user_metadata?.full_name } : undefined },
          { title: event.title, start_at: event.start_at, location: event.location }
        )
        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
        const pdfBase64 = pdfBuffer.toString('base64')

        const recipientName = user?.user_metadata?.full_name || guestData.guest_name || 'there'
        const confirmationTemplate = templates.confirmation as string | undefined
        const confirmationHtml = confirmationTemplate
          ? renderTemplate(confirmationTemplate, {
              name: recipientName,
              event: event.title,
              date: formatDate(event.start_at),
              location: event.location || 'Online',
              ticket: ticketNumber,
            })
          : getRegistrationConfirmationHtml(
              event.title,
              formatDate(event.start_at),
              event.location || 'Online',
              ticketNumber
            )

        await sendEmail({
          to: emailAddress,
          subject: `Registration Confirmed - ${event.title}`,
          html: confirmationHtml,
          attachments: [
            {
              content: pdfBase64,
              filename: `ticket-${ticketNumber}.pdf`,
              type: 'application/pdf',
            },
          ],
        })
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr)
      }
    }

    try {
      const { data: adminProfiles } = await admin
        .from('profiles')
        .select('id')
        .in('role', ['district_admin', 'superadmin'])
      if (adminProfiles && adminProfiles.length > 0) {
        await admin.from('notifications').insert(
          adminProfiles.map((p) => ({
            profile_id: p.id,
            title: 'New registration',
            message: `${guestData.guest_name || 'A member'} registered for "${event.title}"`,
            link: `/admin/events/${id}/registrations`,
          }))
        )
      }
    } catch (notifErr) {
      console.error('Failed to notify district admins:', notifErr)
    }

    const qrPayload = { id: registration.id, ticket: ticketNumber, event: id }
    const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin')}/api/qr/verify`

    return NextResponse.json({
      ...registration,
      qr_url: qrUrl,
      qr_payload: qrPayload,
    }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
