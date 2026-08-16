'use client'

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'

interface FormData {
  guest_name: string
  guest_email: string
  guest_phone?: string
  guest_club?: string
  notes?: string
}

interface EventRegistrationFormProps {
  eventTitle: string
  eventPrice: number
  currency?: string
  onSubmit: (data: FormData) => Promise<void>
  isSubmitting?: boolean
}

export function EventRegistrationForm({
  eventTitle,
  eventPrice,
  currency = 'EGP',
  onSubmit,
  isSubmitting = false,
}: EventRegistrationFormProps) {
  const [isMember, setIsMember] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [club, setClub] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.guest_name = 'Name is required'
    if (!email.trim()) next.guest_email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.guest_email = 'Valid email is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit({ guest_name: name, guest_email: email, guest_phone: phone, guest_club: club, notes })
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy">Register for {eventTitle}</h2>
        {eventPrice > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Fee: {eventPrice} {currency}
          </p>
        )}
        {eventPrice === 0 && (
          <p className="mt-1 text-sm text-green-600">This is a free event</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant={isMember ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsMember(true)}
        >
          Member
        </Button>
        <Button
          type="button"
          variant={!isMember ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsMember(false)}
        >
          Guest
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="guest_name">{isMember ? 'Full Name' : 'Guest Name'} *</Label>
          <Input id="guest_name" value={name} onChange={(e) => setName(e.target.value)} className={cn(errors.guest_name && 'border-red-500')} />
          {errors.guest_name && <p className="mt-1 text-xs text-red-500">{errors.guest_name}</p>}
        </div>

        <div>
          <Label htmlFor="guest_email">Email *</Label>
          <Input id="guest_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={cn(errors.guest_email && 'border-red-500')} />
          {errors.guest_email && <p className="mt-1 text-xs text-red-500">{errors.guest_email}</p>}
        </div>

        <div>
          <Label htmlFor="guest_phone">Phone</Label>
          <Input id="guest_phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="guest_club">{isMember ? 'Your Club' : 'Club Affiliation'}</Label>
          <Input id="guest_club" value={club} onChange={(e) => setClub(e.target.value)} placeholder={isMember ? 'e.g. Cairo University Rotaract' : 'Optional'} />
        </div>

        <div>
          <Label htmlFor="notes">Notes / Special Requirements</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any special requirements or questions..." />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          `Complete Registration${eventPrice > 0 ? ` (${eventPrice} ${currency})` : ''}`
        )}
      </Button>
    </form>
  )
}
