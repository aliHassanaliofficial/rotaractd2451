import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  graduation_year: z.number().int().optional(),
  occupation: z.string().optional(),
  social_linkedin: z.string().url().optional().or(z.literal('')),
  social_instagram: z.string().url().optional().or(z.literal('')),
  social_facebook: z.string().url().optional().or(z.literal('')),
})

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ProfileFormData = z.infer<typeof profileSchema>
export type ContactFormData = z.infer<typeof contactSchema>
