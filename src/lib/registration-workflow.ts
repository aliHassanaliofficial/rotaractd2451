import { v4 as uuidv4 } from 'uuid'
import { sendEmail, getRegistrationConfirmationHtml, getRegistrationPendingHtml, renderTemplate } from '@/lib/utils/email'
import { generateTicketPDF } from '@/lib/utils/pdf'
import { formatDate } from '@/lib/utils/date'
import { getRegistrationCount } from '@/lib/supabase/queries/registrations'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { z } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Event, Registration } from '@/types/database'

export const registrationWorkflowSchema = z.object({
  event_id: z.string().uuid(),
  guest_name: z.string().min(2, 'Name is required').optional(),
  guest_email: z.string().email('Valid email is required').optional(),
  guest_phone: z.string().optional(),
  guest_club: z.string().optional(),
  notes: z.string().optional(),
  transaction_method_id: z.string().uuid().optional(),
  transaction_proof_url: z.string().optional(),
})

export type RegistrationWorkflowInput = z.infer<typeof registrationWorkflowSchema>

export interface WorkflowDeps {
  supabase: SupabaseClient
  admin: SupabaseClient
  user: User | null
  event: Event
  body: unknown
  origin: string
}

export interface WorkflowResult {
  registration: Registration
  qr_payload?: { id: string; ticket: string; event: string }
  qr_url?: string
}

export async function registerForEvent(deps: WorkflowDeps): Promise<WorkflowResult> {
  const { supabase, admin, user, event, body, origin } = deps

  if (event.status !== 'published') {
    throw new WorkflowError('Event is not open for registration', 400)
  }
  if (!event.registration_open) {
    throw new WorkflowError('Registration is closed for this event', 400)
  }
  if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
    throw new WorkflowError('Registration deadline has passed', 400)
  }

  const { data: flagsRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'feature_flags')
    .maybeSingle()
  const flags = flagsRow?.value as { registration_open?: boolean } | null
  if (flags?.registration_open === false) {
    throw new WorkflowError('Registration is currently closed by the district', 403)
  }

  const parsed = registrationWorkflowSchema.parse(body)

  if (user) {
    const { data: existing } = await admin
      .from('registrations')
      .select('id')
      .eq('event_id', event.id)
      .eq('profile_id', user.id)
      .maybeSingle()
    if (existing) {
      throw new WorkflowError('You are already registered for this event', 409)
    }
  } else {
    if (!parsed.guest_name || !parsed.guest_email) {
      throw new WorkflowError('Guest name and email are required', 400)
    }
    if (event.registration_type === 'members_only') {
      throw new WorkflowError('This event is for members only. Sign in to register.', 403)
    }
  }

  if (event.capacity) {
    const currentCount = await getRegistrationCount(event.id)
    if (currentCount >= event.capacity) {
      throw new WorkflowError('Event has reached maximum capacity', 400)
    }
  }

  const normalizePhone = (p?: string | null) => {
    if (!p) return ''
    let d = p.replace(/\D/g, '')
    if (d.startsWith('20') && d.length > 9) d = '0' + d.slice(2)
    return d
  }
  const normalizeEmail = (e?: string | null) => (e || '').trim().toLowerCase()

  const memberPhone = user
    ? (await admin.from('profiles').select('phone').eq('id', user.id).maybeSingle()).data?.phone
    : null
  const identityEmail = user?.email || parsed.guest_email
  const identityPhone = user ? memberPhone : parsed.guest_phone

  if (identityEmail || identityPhone) {
    const { data: blockedContacts } = await admin
      .from('blacklist')
      .select('phone, email')
    if (blockedContacts && blockedContacts.length > 0) {
      const normEmail = normalizeEmail(identityEmail)
      const normPhone = normalizePhone(identityPhone)
      const isBlocked = blockedContacts.some(
        (b) =>
          (normEmail && normalizeEmail(b.email) === normEmail) ||
          (normPhone && normalizePhone(b.phone) === normPhone)
      )
      if (isBlocked) {
        throw new WorkflowError('Registration blocked: this contact is on the district blacklist', 403)
      }
    }
  }

  const isPaid = event.price > 0
  let transactionMethod: { id: string; name: string } | undefined

  if (isPaid) {
    if (!parsed.transaction_method_id) {
      throw new WorkflowError('Please choose a payment method', 400)
    }
    const { data: method } = await admin
      .from('transaction_methods')
      .select('id, name')
      .eq('id', parsed.transaction_method_id)
      .eq('is_active', true)
      .maybeSingle()
    if (!method) {
      throw new WorkflowError('Selected payment method is not available', 400)
    }
    transactionMethod = method

    if (!parsed.transaction_proof_url) {
      throw new WorkflowError('Please upload a payment proof', 400)
    }
    try {
      const url = new URL(parsed.transaction_proof_url)
      if (!url.pathname.includes(`/${STORAGE_BUCKETS.REGISTRATION_PROOFS}/`)) {
        throw new Error('not a proof bucket url')
      }
    } catch {
      throw new WorkflowError('Please upload the payment proof to our storage', 400)
    }
  }

  const qrCode = uuidv4()
  const ticketNumber = `R2451-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const status: Registration['status'] = isPaid ? 'pending' : 'confirmed'

  const identityFields = user
    ? {
        profile_id: user.id,
        guest_name:
          parsed.guest_name || (user.user_metadata?.full_name as string) || null,
      }
    : {
        guest_name: parsed.guest_name,
        guest_email: parsed.guest_email,
        guest_phone: parsed.guest_phone || null,
        guest_club: parsed.guest_club || null,
      }

  const registrationData = {
    event_id: event.id,
    qr_code: qrCode,
    ticket_number: ticketNumber,
    status,
    notes: parsed.notes,
    transaction_method_id: transactionMethod?.id || null,
    transaction_proof_url: isPaid ? parsed.transaction_proof_url : null,
    ...identityFields,
  }

  const { data: registration, error } = await admin
    .from('registrations')
    .insert(registrationData as any)
    .select('*, event:event_id(*), profile:profile_id(*), transaction_method:transaction_method_id(*)')
    .single()

  if (error) {
    throw new WorkflowError('Failed to register: ' + error.message, 500)
  }

  const { data: templatesData } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'email_templates')
    .maybeSingle()
  const templates = (templatesData?.value as Record<string, unknown> | undefined) || {}

  const emailAddress = user?.email || parsed.guest_email
  if (emailAddress) {
    try {
      const recipientName = user?.user_metadata?.full_name || parsed.guest_name || 'there'

      if (status === 'pending' && transactionMethod) {
        const amount = `${event.currency} ${event.price}`
        const pendingTemplate = templates.pending as string | undefined
        const pendingHtml = pendingTemplate
          ? renderTemplate(pendingTemplate, {
              name: recipientName,
              event: event.title,
              date: formatDate(event.start_at),
              amount,
              method: transactionMethod.name,
            })
          : getRegistrationPendingHtml(event.title, formatDate(event.start_at), amount, transactionMethod.name)

        await sendEmail({
          to: emailAddress,
          subject: `Registration Received - ${event.title}`,
          html: pendingHtml,
        })
      } else {
        const { data: districtSetting } = await admin
          .from('site_settings')
          .select('value')
          .eq('key', 'district_info')
          .maybeSingle()
        const districtInfo = (districtSetting?.value as Record<string, unknown> | undefined) || {}

        const pdfBlob = await generateTicketPDF(
          {
            id: registration.id,
            ticket_number: ticketNumber,
            profile: (registration.profile as { full_name?: string } | null)?.full_name
              ? { full_name: (registration.profile as { full_name?: string }).full_name! }
              : undefined,
            guest_name: registration.guest_name,
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
      }
    } catch (emailErr) {
      console.error('Failed to send registration email:', emailErr)
    }
  }

  try {
    const { data: adminProfiles } = await admin
      .from('profiles')
      .select('id')
      .in('role', ['district_admin', 'superadmin'])
    if (adminProfiles && adminProfiles.length > 0) {
      await admin.from('notifications').insert(
        adminProfiles.map((p: { id: string }) => ({
          profile_id: p.id,
          title: status === 'pending' ? 'New registration awaiting approval' : 'New registration',
          message: `${parsed.guest_name || 'A member'} registered for "${event.title}"`,
          link: `/admin/events/${event.id}/registrations`,
        }))
      )
    }
  } catch (notifErr) {
    console.error('Failed to notify district admins:', notifErr)
  }

  const qrPayload = { id: registration.id, ticket: ticketNumber, event: event.id }
  const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL || origin}/api/qr/verify`

  return {
    registration,
    qr_payload: qrPayload,
    qr_url: qrUrl,
  }
}

export class WorkflowError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}