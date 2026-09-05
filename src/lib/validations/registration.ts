import { z } from 'zod'

export const registrationSchema = z.object({
  event_id: z.string().uuid(),
  profile_id: z.string().uuid().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().optional(),
  guest_club: z.string().optional(),
  notes: z.string().optional(),
  transaction_method_id: z.string().uuid().optional(),
  transaction_proof_url: z.string().optional(),
})

export const guestRegistrationSchema = z.object({
  event_id: z.string().uuid(),
  guest_name: z.string().min(2, 'Name is required'),
  guest_email: z.string().email('Valid email is required'),
  guest_phone: z.string().optional(),
  guest_club: z.string().optional(),
  notes: z.string().optional(),
  transaction_method_id: z.string().uuid().optional(),
  transaction_proof_url: z.string().optional(),
})

export type RegistrationFormData = z.infer<typeof registrationSchema>
export type GuestRegistrationFormData = z.infer<typeof guestRegistrationSchema>
