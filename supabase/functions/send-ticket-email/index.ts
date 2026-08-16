import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

serve(async (req) => {
  try {
    const { registrationId } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: reg, error } = await supabase
      .from('registrations')
      .select('*, events(*), profiles(*, clubs(*))')
      .eq('id', registrationId)
      .single()

    if (error || !reg) {
      return new Response(JSON.stringify({ error: 'Registration not found' }), { status: 404 })
    }

    const email = reg.profile?.email || reg.guest_email
    if (!email) {
      return new Response(JSON.stringify({ error: 'No email address' }), { status: 400 })
    }

    const eventName = reg.events?.title || 'Event'
    const ticketNumber = reg.ticket_number || 'N/A'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #003865; padding: 20px; text-align: center;">
          <h1 style="color: #F7A81B; margin: 0;">Rotaract District 2451</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2>Registration Confirmed!</h2>
          <p>You have successfully registered for:</p>
          <h3 style="color: #003865;">${eventName}</h3>
          <p><strong>Ticket:</strong> ${ticketNumber}</p>
          <p>Your e-ticket is attached to this email. Please present it at the entrance.</p>
        </div>
        <div style="background: #D91B5C; padding: 15px; text-align: center; color: white;">
          <p style="margin: 0;">Rotaract District 2451</p>
        </div>
      </div>
    `

    return new Response(JSON.stringify({ success: true, email }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
