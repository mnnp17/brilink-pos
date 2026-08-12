import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // If not authenticated, redirect to login (except for auth routes)
  if (!user && !pathname.startsWith('/login') && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated, check role-based access
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, must_change_password')
      .eq('id', user.id)
      .single()

    // Force password change
    if (profile?.must_change_password && !pathname.startsWith('/change-password') && !pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/change-password'
      return NextResponse.redirect(url)
    }

    // Role-based route protection
    const role = profile?.role

    // Admin/Developer routes
    if (pathname.startsWith('/admin') && role !== 'developer') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'owner' ? '/dashboard' : '/pos'
      return NextResponse.redirect(url)
    }

    // Owner routes
    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/accounts') || pathname.startsWith('/reports')) &&
        !['developer', 'owner'].includes(role || '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/pos'
      return NextResponse.redirect(url)
    }

    // Redirect root based on role
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      if (role === 'developer') url.pathname = '/admin'
      else if (role === 'owner') url.pathname = '/dashboard'
      else url.pathname = '/pos'
      return NextResponse.redirect(url)
    }

    // Redirect login page if already authenticated
    if (pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      if (role === 'developer') url.pathname = '/admin'
      else if (role === 'owner') url.pathname = '/dashboard'
      else url.pathname = '/pos'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
