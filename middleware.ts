import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request: { headers: request.headers } })

  // Create Supabase client with middleware cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name)              { return request.cookies.get(name)?.value },
        set(name, value, opts) { request.cookies.set({ name, value, ...opts }); response.cookies.set({ name, value, ...opts }) },
        remove(name, opts)     { request.cookies.set({ name, value: '', ...opts }); response.cookies.set({ name, value: '', ...opts }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // ── Public routes — allow through ──────────────────────────────
  const publicRoutes = ['/', '/login', '/admin/login', '/api/auth']
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    // Redirect already-logged-in users away from login pages
    if (session && (pathname === '/login' || pathname === '/')) {
      return NextResponse.redirect(new URL('/app', request.url))
    }
    return response
  }

  // ── /app/* — requires authenticated non-banned member ──────────
  if (pathname.startsWith('/app')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Check if banned (we fetch the profile)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned, onboarding_complete, is_admin')
      .eq('id', session.user.id)
      .single()

    if (profile?.is_banned) {
      return NextResponse.redirect(new URL('/login?error=banned', request.url))
    }
    if (profile?.is_admin) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // Redirect to onboarding if not completed
    if (!profile?.onboarding_complete && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return response
  }

  // ── /admin/* — requires admin role ─────────────────────────────
  if (pathname.startsWith('/admin')) {
    // /admin/login is public
    if (pathname === '/admin/login') return response

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      // Not an admin — send to member login, not admin login
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── /onboarding — requires session ─────────────────────────────
  if (pathname.startsWith('/onboarding')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
}
