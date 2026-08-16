import { z } from 'zod'

export const postSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.any().optional(),
  cover_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_announcement: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  announcement_priority: z.enum(['normal', 'important', 'urgent']).default('normal'),
  tags: z.array(z.string()).optional(),
  published_at: z.string().optional(),
  expires_at: z.string().optional(),
})

export type PostFormData = z.input<typeof postSchema>
