import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('start_at', now.toISOString())
      .lte('start_at', tomorrow.toISOString())

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    for (const event of events) {
      const { data: registrations } = await supabase
        .from('registrations')
        .select('*, profiles(*), guest_email')
        .eq('event_id', event.id)
        .in('status', ['confirmed', 'pending'])

      if (!registrations) continue

      for (const reg of registrations) {
        const email = reg.profiles?.email || reg.guest_email
        if (!email) continue
      }
    }

    return new Response(JSON.stringify({ success: true, events: events.length }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
