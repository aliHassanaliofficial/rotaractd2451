import { NextResponse } from 'next/server'
import { contactSchema } from '@/lib/validations/profile'
import { createContactMessage, getSiteSetting } from '@/lib/supabase/queries/settings'
import { sendEmail } from '@/lib/utils/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = contactSchema.parse(body)

    await createContactMessage({
      name: parsed.name,
      email: parsed.email,
      subject: parsed.subject,
      message: parsed.message,
    })

    try {
      const districtEmail = (await getSiteSetting('district_email'))?.value || process.env.DISTRICT_EMAIL || 'info@rotaractd2451.org'

      await sendEmail({
        to: districtEmail,
        subject: `New Contact Message: ${parsed.subject || 'No Subject'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #003865;">New Contact Message</h2>
            <p><strong>From:</strong> ${parsed.name} (${parsed.email})</p>
            ${parsed.subject ? `<p><strong>Subject:</strong> ${parsed.subject}</p>` : ''}
            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 3px solid #D91B5C; padding-left: 15px; margin: 10px 0;">
              ${parsed.message.replace(/\n/g, '<br>')}
            </blockquote>
            <p style="color: #666; font-size: 12px;">Sent via Rotaract contact form</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send contact notification email:', emailErr)
    }

    return NextResponse.json({
      message: 'Message sent successfully. We will get back to you soon.',
    }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
