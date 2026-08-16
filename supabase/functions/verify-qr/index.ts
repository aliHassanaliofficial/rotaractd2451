import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { payload } = await req.json()
    const data = JSON.parse(payload)

    if (!data.id || !data.ticket || !data.event) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid QR payload' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('*, events(*), profiles(*)')
      .eq('id', data.id)
      .eq('ticket_number', data.ticket)
      .single()

    if (error || !registration) {
      return new Response(JSON.stringify({ valid: false, error: 'Registration not found' }), { status: 404 })
    }

    if (registration.status === 'cancelled') {
      return new Response(JSON.stringify({ valid: false, error: 'Registration cancelled' }), { status: 400 })
    }

    return new Response(
      JSON.stringify({
        valid: true,
        registration: {
          id: registration.id,
          ticket_number: registration.ticket_number,
          status: registration.status,
          attendee_name: registration.profiles?.full_name || registration.guest_name,
        },
        event: {
          title: registration.events?.title,
          start_at: registration.events?.start_at,
        },
      }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
