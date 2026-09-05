import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { sendEmail, getRegistrationConfirmationHtml, getRegistrationDeclinedHtml, renderTemplate } from '@/lib/utils/email'
import { generateTicketPDF } from '@/lib/utils/pdf'
import { formatDate } from '@/lib/utils/date'
import { createAuditLog } from '@/lib/supabase/queries/settings'
import { getDistrictInfoServer } from '@/lib/supabase/queries/settings.server'

const updateSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'declined']),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: registration, error: fetchError } = await admin
      .from('registrations')
      .select('*, event:event_id(*), profile:profile_id(*), transaction_method:transaction_method_id(*)')
      .eq('id', id)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const isAdmin = role && ['club_admin', 'district_admin', 'superadmin'].includes(role)
    const isOwner = registration.profile_id === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (parsed.data.status === 'declined' && role !== 'district_admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Only district admins can decline registrations' }, { status: 403 })
    }

    const { data, error } = await admin
      .from('registrations')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, event:event_id(*), profile:profile_id(*), transaction_method:transaction_method_id(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const event = data.event
    const recipientName = data.profile?.full_name || data.guest_name || 'there'
    const toEmail = data.profile?.email || data.guest_email

    if (parsed.data.status === 'confirmed' && registration.status === 'pending' && toEmail && event) {
      try {
        const districtInfo = (await getDistrictInfoServer()) || {}
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://rotaract2451.org'
        const pdfBlob = await generateTicketPDF(
          {
            id,
            ticket_number: data.ticket_number,
            guest_name: data.profile_id ? undefined : data.guest_name,
            profile: data.profile ? { full_name: data.profile.full_name } : undefined,
          },
          { title: event.title, start_at: event.start_at, location: event.location },
          {
            districtName: (districtInfo.name as string) || 'Rotaract District 2451',
            logoUrl: '/logo-white.png',
            siteUrl: origin,
          }
        )
        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
        const pdfBase64 = pdfBuffer.toString('base64')

        const { data: templatesData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'email_templates')
          .maybeSingle()
        const templates = (templatesData?.value as Record<string, any>) || {}

        const confirmationTemplate = templates.confirmation as string | undefined
        const html = confirmationTemplate
          ? renderTemplate(confirmationTemplate, {
              name: recipientName,
              event: event.title,
              date: formatDate(event.start_at),
              location: event.location || 'Online',
              ticket: data.ticket_number || '',
            })
          : getRegistrationConfirmationHtml(event.title, formatDate(event.start_at), event.location || 'Online', data.ticket_number || '')

        await sendEmail({
          to: toEmail,
          subject: `Registration Confirmed - ${event.title}`,
          html,
          attachments: [
            {
              content: pdfBase64,
              filename: `ticket-${data.ticket_number || id}.pdf`,
              type: 'application/pdf',
            },
          ],
        })
      } catch (emailErr) {
        console.error('Failed to send approval email:', emailErr)
      }
    }

    if (parsed.data.status === 'declined' && toEmail && event) {
      try {
        const { data: templatesData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'email_templates')
          .maybeSingle()
        const templates = (templatesData?.value as Record<string, any>) || {}
        const declinedTemplate = templates.declined as string | undefined
        const html = declinedTemplate
          ? renderTemplate(declinedTemplate, { name: recipientName, event: event.title })
          : getRegistrationDeclinedHtml(event.title)

        await sendEmail({
          to: toEmail,
          subject: `Registration Update - ${event.title}`,
          html,
        })
      } catch (emailErr) {
        console.error('Failed to send decline email:', emailErr)
      }
    }

    if (isAdmin && parsed.data.status !== registration.status) {
      await createAuditLog({
        actor_id: user.id,
        action: 'update_registration_status',
        table_name: 'registrations',
        record_id: id,
        new_data: { status: parsed.data.status, from: registration.status },
      }).catch(() => {})
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}