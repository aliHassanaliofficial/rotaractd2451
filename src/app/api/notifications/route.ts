import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createNotification, getUserNotifications, markNotificationRead } from '@/lib/supabase/queries/settings'
import { z } from 'zod'

const createNotificationSchema = z.object({
  profile_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().optional(),
  link: z.string().optional(),
})

const markReadSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await getUserNotifications(user.id)

    const unreadCount = notifications.filter(n => !n.is_read).length

    return NextResponse.json({
      notifications,
      unread_count: unreadCount,
      total: notifications.length,
    })
  } catch (err) {
    console.error('Get notifications error:', err)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['district_admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Only district admins can send notifications' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createNotificationSchema.parse(body)

    const notification = await createNotification(parsed)

    return NextResponse.json(notification, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Create notification error:', err)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = markReadSchema.parse(body)

    const { data: notification } = await supabase
      .from('notifications')
      .select('profile_id')
      .eq('id', parsed.id)
      .single()

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.profile_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await markNotificationRead(parsed.id)

    return NextResponse.json({ message: 'Notification marked as read' })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('Mark read error:', err)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('profile_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
    }

    return NextResponse.json({ message: 'All notifications cleared' })
  } catch (err) {
    console.error('Clear notifications error:', err)
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
  }
}
