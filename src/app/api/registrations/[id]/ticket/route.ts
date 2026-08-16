import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateTicketPDF } from '@/lib/utils/pdf'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('*, event:event_id(*), profile:profile_id(*, club:club_id(*))')
      .eq('id', id)
      .single()

    if (error || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (user && registration.profile_id && registration.profile_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['club_admin', 'district_admin', 'superadmin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const pdfBlob = await generateTicketPDF(registration, registration.event)

    const filename = `ticket-${registration.ticket_number || 'unknown'}.pdf`

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('Ticket generation error:', err)
    return NextResponse.json({ error: 'Failed to generate ticket' }, { status: 500 })
  }
}
