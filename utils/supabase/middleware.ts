import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthRoute = pathname === '/vendor/login' || pathname === '/sales/login' || pathname === '/sales/register' || pathname === '/secure-admin-login' || pathname.startsWith('/auth')
  const isPublicRoute = pathname === '/' || isAuthRoute || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/api/')

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    if (pathname.startsWith('/vendor')) {
      url.pathname = '/vendor/login'
    } else if (pathname.startsWith('/sales')) {
      url.pathname = '/sales/login'
    } else {
      url.pathname = '/'
    }
    return NextResponse.redirect(url)
  }

  // Role-based routing for authenticated users
  if (user) {
    // 1. Fetch user role from profile
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const userRole = profile?.role || user.user_metadata?.role || 'customer'
    
    // 2. Prevent accessing login/register routes if authenticated
    if (isAuthRoute && !pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      if (userRole === 'admin') url.pathname = '/dashboard'
      else if (userRole === 'vendor') url.pathname = '/vendor/dashboard'
      else if (userRole === 'sales_executive') url.pathname = '/sales/dashboard'
      else url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // 3. Enforce access control for vendor routes
    if (pathname.startsWith('/vendor') && userRole !== 'vendor') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'admin' ? '/dashboard' : (userRole === 'sales_executive' ? '/sales/dashboard' : '/')
      return NextResponse.redirect(url)
    }

    // 4. Enforce access control for sales routes
    if (pathname.startsWith('/sales') && userRole !== 'sales_executive') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'admin' ? '/dashboard' : (userRole === 'vendor' ? '/vendor/dashboard' : '/')
      return NextResponse.redirect(url)
    }

    // 5. Enforce access control for admin dashboard
    // Admin dashboard routes usually start with /dashboard, /admin, etc.
    // Wait, vendor dashboard is /vendor/dashboard, sales is /sales/dashboard.
    // We should strictly prevent vendor/sales from accessing /dashboard, /admin.
    if ((pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname.startsWith('/admin')) 
        && userRole !== 'admin') {
      const url = request.nextUrl.clone()
      if (userRole === 'vendor') url.pathname = '/vendor/dashboard'
      else if (userRole === 'sales_executive') url.pathname = '/sales/dashboard'
      else url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
