import type { Metadata } from 'next'
import { getBlacklist } from '@/lib/supabase/queries/settings'
import { ShieldAlert, Ban, Mail, Phone } from 'lucide-react'
import type { BlacklistEntry } from '@/types/database'

export const metadata: Metadata = {
  title: 'Blacklist',
  description: 'Official list of individuals barred from Rotaract District 2451 activities.',
  alternates: { canonical: '/blacklist' },
}

function maskPhone(phone?: string) {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.length <= 4) return digits.charAt(0) + '••••'
  return `${digits.slice(0, 3)} ••••• ${digits.slice(-2)}`
}

function maskEmail(email?: string) {
  if (!email) return null
  const at = email.indexOf('@')
  if (at <= 0) return email
  const first = email.charAt(0)
  const domain = email.slice(at)
  return `${first}••••••${domain}`
}

export default async function BlacklistPage() {
  const blacklist = await getBlacklist().catch(() => [])

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-navy via-[#0a4a82] to-cranberry/50 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <ShieldAlert className="mx-auto mb-4 h-14 w-14 text-gold" />
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Blacklist</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Individuals on this list are not permitted to register for or attend Rotaract District 2451 activities.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-cranberry/20 bg-cranberry/5 p-4">
            <Ban className="h-5 w-5 shrink-0 text-cranberry" />
            <p className="text-sm text-cranberry">
              Registration is automatically blocked for any phone number or email listed below. If you believe this
              applies to you in error, please contact the district registration team.
            </p>
          </div>

          {blacklist.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400">The blacklist is currently empty.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="hidden px-4 py-3 md:table-cell">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklist.map((entry: BlacklistEntry) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-navy">{entry.name}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.reason || '—'}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                          {maskPhone(entry.phone) && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {maskPhone(entry.phone)}
                            </span>
                          )}
                          {maskEmail(entry.email) && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {maskEmail(entry.email)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}