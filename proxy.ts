import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getDashboardPathForRole, getRoleFromUserMetadata } from '@/lib/utils/auth-routing';

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/pos': ['KASIR', 'KARYAWAN', 'OWNER', 'DEVELOPER'],
  '/developer': ['DEVELOPER'],
  '/dashboard': ['OWNER', 'DEVELOPER'],
  '/accounts': ['OWNER', 'DEVELOPER'],
  '/reports': ['OWNER', 'DEVELOPER'],
  '/staff': ['OWNER', 'DEVELOPER'],
  '/services': ['OWNER', 'DEVELOPER'],
  '/expenses': ['OWNER', 'DEVELOPER'],
  '/change-password': ['DEVELOPER', 'OWNER', 'KASIR', 'KARYAWAN'],
  '/force-change-password': ['DEVELOPER', 'OWNER', 'KASIR', 'KARYAWAN'],
};

async function resolveRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  userMetadata: Record<string, unknown> | undefined
): Promise<string | null> {
  const roleInput: { user_metadata: Record<string, unknown> | null } = { user_metadata: userMetadata ?? null };
  let role = getRoleFromUserMetadata(roleInput as { user_metadata: import('@supabase/supabase-js').UserMetadata });

  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    role = profile?.role?.toUpperCase() ?? null;
  }

  if (!role) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    role = userProfile?.role?.toUpperCase() ?? null;
  }

  return role;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // Check for mock session cookies (instantly bypass Auth for local development mock users)
  const ownerMockCookie = request.cookies.get('owner-mock-session')?.value === 'true';
  const cashierMockCookie = request.cookies.get('cashier-mock-session')?.value === 'true';
  const isMock = ownerMockCookie || cashierMockCookie;
  const mockRole = ownerMockCookie ? 'OWNER' : (cashierMockCookie ? 'KASIR' : null);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Unauthenticated protection
  if (!user && !isMock && (path.startsWith('/pos') || path.startsWith('/developer') || path.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user || isMock) {
    const role = isMock ? mockRole : await resolveRole(supabase, user!.id, (user as any).user_metadata);

    console.log('DEBUG LOGGED IN USER ROLE:', role);

    // 2. Protect /developer route (DEVELOPER only)
    if (path.startsWith('/developer') && role !== 'DEVELOPER') {
      return NextResponse.redirect(new URL('/pos', request.url));
    }

    // 3. Auto-redirect from / or /login when authenticated
    if (path === '/' || path === '/login') {
      return NextResponse.redirect(new URL(getDashboardPathForRole(role), request.url));
    }

    // Other protected routes
    const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
      path.startsWith(route)
    );

    if (matchedRoute) {
      if (!role) {
        if (matchedRoute === '/pos') {
          return response;
        }
        return NextResponse.redirect(new URL('/pos', request.url));
      }

      const allowedRoles = PROTECTED_ROUTES[matchedRoute];

      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(getDashboardPathForRole(role), request.url));
      }
    }
  } else {
    const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
      path.startsWith(route)
    );

    if (matchedRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/pos/:path*',
    '/developer/:path*',
    '/dashboard/:path*',
    '/accounts/:path*',
    '/reports/:path*',
    '/staff/:path*',
    '/services/:path*',
    '/expenses/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
