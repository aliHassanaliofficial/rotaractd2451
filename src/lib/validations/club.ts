import { z } from 'zod'

export const clubSchema = z.object({
  name: z.string().min(2, 'Club name is required'),
  slug: z.string().optional(),
  charter_date: z.string().optional(),
  description: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  cover_url: z.string().url().optional().or(z.literal('')),
  university: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Egypt'),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  founded_year: z.number().int().optional(),
  meeting_day: z.string().optional(),
  meeting_time: z.string().optional(),
  meeting_location: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type ClubFormData = z.input<typeof clubSchema>
