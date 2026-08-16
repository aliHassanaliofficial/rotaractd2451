import QRCode from 'qrcode'

export async function generateQRDataUrl(data: object): Promise<string> {
  return QRCode.toDataURL(JSON.stringify(data), {
    width: 300,
    margin: 2,
    color: {
      dark: '#003865',
      light: '#ffffff',
    },
  })
}

export function encodeQRPayload(registrationId: string, ticketNumber: string, eventId: string) {
  return JSON.stringify({ id: registrationId, ticket: ticketNumber, event: eventId })
}

export function decodeQRPayload(payload: string): { id: string; ticket: string; event: string } | null {
  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}
