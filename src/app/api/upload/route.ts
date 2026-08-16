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

const ALLOWED_BUCKETS = Object.values(STORAGE_BUCKETS)

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucketName = (formData.get('bucket') as string) || STORAGE_BUCKETS.DOCUMENTS
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_BUCKETS.includes(bucketName as any)) {
      return NextResponse.json({ error: 'Invalid storage bucket' }, { status: 400 })
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
