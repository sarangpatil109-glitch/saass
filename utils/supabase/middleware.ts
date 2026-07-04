import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {

  const devMode = process.env.DEVELOPMENT_MODE === 'true';

  // If development mode, skip all auth checks and return response directly
  if (devMode) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users (except login/auth pages and root) to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch profile for role and status checks
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (profile) {
      if (profile.status === 'suspended' || profile.status === 'inactive') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      const path = request.nextUrl.pathname;
      if (path.startsWith('/admin') && profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/vendor') && profile.role !== 'vendor') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/sales') && profile.role !== 'sales_executive') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Auto-create profile if missing
  if (user) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    if (!existingProfile) {
      const role = user.email === process.env.DEFAULT_ADMIN_EMAIL ? 'admin' : 'user';
      await supabase.from('profiles').insert({ id: user.id, role, status: 'active' });
    }
  }

  return supabaseResponse;
}
