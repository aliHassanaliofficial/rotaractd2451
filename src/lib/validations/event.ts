import { z } from 'zod'

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().nullish(),
  description: z.string().nullish(),
  rich_description: z.any().nullish(),
  cover_url: z.string().url().nullish().or(z.literal('')),
  start_at: z.string().min(1, 'Start date is required'),
  end_at: z.string().min(1, 'End date is required'),
  location: z.string().nullish(),
  location_url: z.string().url().nullish().or(z.literal('')),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  is_online: z.boolean().default(false),
  online_url: z.string().url().nullish().or(z.literal('')),
  capacity: z.number().positive().nullish(),
  registration_open: z.boolean().default(true),
  registration_deadline: z.string().nullish(),
  registration_type: z.enum(['public', 'members_only']).default('public'),
  price: z.number().min(0).default(0),
  currency: z.string().default('EGP'),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
  host_club_id: z.string().uuid().nullish(),
  organizer_id: z.string().uuid().nullish(),
  category: z.string().nullish(),
  calendar_type: z.enum(['event', 'project', 'meeting']).default('event'),
  tags: z.array(z.string()).nullish(),
  agenda: z.any().nullish(),
  sponsors: z.any().nullish(),
})

export type EventFormData = z.input<typeof eventSchema>
