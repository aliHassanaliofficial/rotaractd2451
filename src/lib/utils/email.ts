import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments?: { content: string; filename: string; type: string }[]
}) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid not configured. Email not sent.')
    return { success: false, error: 'SendGrid not configured' }
  }

  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM || 'noreply@rotaractd2451.org',
      subject,
      html,
      attachments,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '')
}

export function getRegistrationConfirmationHtml(eventName: string, date: string, location: string, ticketNumber: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #003865; padding: 20px; text-align: center;">
        <h1 style="color: #F7A81B; margin: 0;">Rotaract</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa;">
        <h2>Registration Confirmed!</h2>
        <p>You have successfully registered for:</p>
        <h3 style="color: #003865;">${eventName}</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Ticket:</strong> ${ticketNumber}</p>
        <p>Your e-ticket is attached to this email. Please present it at the entrance.</p>
      </div>
      <div style="background: #D91B5C; padding: 15px; text-align: center; color: white;">
        <p style="margin: 0;">Rotaract</p>
      </div>
    </div>
  `
}

export function getRegistrationPendingHtml(eventName: string, date: string, amount: string, methodName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #003865; padding: 20px; text-align: center;">
        <h1 style="color: #F7A81B; margin: 0;">Rotaract</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa;">
        <h2>Registration Received!</h2>
        <p>Thank you for registering for:</p>
        <h3 style="color: #003865;">${eventName}</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Fee:</strong> ${amount} via ${methodName}</p>
        <p>Your registration is <strong>awaiting payment approval</strong>. Our team will review your payment and confirm your registration shortly. Once approved, you will receive your e-ticket by email.</p>
      </div>
      <div style="background: #D91B5C; padding: 15px; text-align: center; color: white;">
        <p style="margin: 0;">Rotaract</p>
      </div>
    </div>
  `
}

export function getRegistrationDeclinedHtml(eventName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #003865; padding: 20px; text-align: center;">
        <h1 style="color: #F7A81B; margin: 0;">Rotaract</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa;">
        <h2>Registration Declined</h2>
        <p>We're sorry, but your registration for:</p>
        <h3 style="color: #003865;">${eventName}</h3>
        <p>could not be approved. Your payment could not be verified and no amount has been charged to you.</p>
        <p>If you believe this is an error, please contact the registration team with your name and the event details.</p>
      </div>
      <div style="background: #D91B5C; padding: 15px; text-align: center; color: white;">
        <p style="margin: 0;">Rotaract</p>
      </div>
    </div>
  `
}
