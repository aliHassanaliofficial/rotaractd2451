import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get: (n) => request.cookies.get(n)?.value,
        set: (n, v, o) => {
          response.cookies.set({ name: n, value: v, ...o })
        },
        remove: (n, o) => {
          response.cookies.set({ name: n, value: '', ...o })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (!user) {
    const protectedPaths = ['/admin', '/club-admin', '/superadmin', '/member']
    if (protectedPaths.some((p) => path === p || path.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL('/login?redirect=' + path, request.url))
    }
    return response
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? null

  if (path === '/admin' || path.startsWith('/admin/')) {
    if (role === 'club_admin') {
      return NextResponse.redirect(new URL('/club-admin', request.url))
    }
    if (role !== 'district_admin' && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/login?redirect=' + path, request.url))
    }
    return response
  }

  if (path === '/club-admin' || path.startsWith('/club-admin/')) {
    if (role !== 'club_admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  if (path === '/superadmin' || path.startsWith('/superadmin/')) {
    if (role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  if (path === '/member' || path.startsWith('/member/')) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/club-admin',
    '/club-admin/:path*',
    '/superadmin',
    '/superadmin/:path*',
    '/member',
    '/member/:path*',
  ],
}
