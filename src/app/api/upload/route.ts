import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

const ALLOWED_BUCKETS = Object.values(STORAGE_BUCKETS)

// Uploads are normally restricted to signed-in users. Avatars are uploaded
// from the registration form before the account exists, so allow anonymous
// uploads to the avatars bucket only, throttled per IP.
const anonymousUploads = new Map<string, { count: number; resetAt: number }>()

function allowAnonymousUpload(ip: string): boolean {
  const now = Date.now()
  const window = 60000
  const maxRequests = 10
  const entry = anonymousUploads.get(ip)
  if (!entry || now > entry.resetAt) {
    anonymousUploads.set(ip, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucketName = (formData.get('bucket') as string) || STORAGE_BUCKETS.DOCUMENTS
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!ALLOWED_BUCKETS.includes(bucketName as any)) {
      return NextResponse.json({ error: 'Invalid storage bucket' }, { status: 400 })
    }

    const isAnonymous = bucketName === STORAGE_BUCKETS.AVATARS

    if (isAnonymous) {
      if (!allowAnonymousUpload(ip)) {
        return NextResponse.json(
          { error: 'Too many uploads. Please wait a minute and try again.' },
          { status: 429 }
        )
      }
    } else {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (isAnonymous && file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} is not allowed` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'bin'
    const fileName = `${uuidv4()}.${ext}`
    const filePath = `${folder}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
      fileName: file.name,
      size: file.size,
      type: file.type,
      bucket: bucketName,
    }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
