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

  const isAuthRoute = pathname === '/vendor/login' || pathname === '/sales/login' || pathname === '/sales/register' || pathname === '/admin/login' || pathname.startsWith('/auth')
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
    const userRole = profile?.role || user.user_metadata?.role

    // Determine target dashboard based on role
    let userDashboard: string | null = null
    if (userRole === 'admin') userDashboard = '/dashboard'
    else if (userRole === 'vendor') userDashboard = '/vendor/dashboard'
    else if (userRole === 'sales_executive') userDashboard = '/sales/dashboard'

    // If they have no recognized role, do not attempt to redirect them to a dashboard
    // The instructions state: "Do not redirect authenticated users to '/'"

    // 2. Prevent accessing login/register routes if authenticated
    if (isAuthRoute && !pathname.startsWith('/auth')) {
      if (userDashboard) {
        const url = request.nextUrl.clone()
        url.pathname = userDashboard
        return NextResponse.redirect(url)
      }
    }

    // Determine current route type
    const isVendorRoute = pathname.startsWith('/vendor') && !pathname.startsWith('/vendor/login')
    const isSalesRoute = pathname.startsWith('/sales') && !pathname.startsWith('/sales/login') && !pathname.startsWith('/sales/register')
    const isAdminRoute = (pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname.startsWith('/admin')) && !pathname.startsWith('/admin/login')

    // 3. Enforce access control for vendor routes
    if (isVendorRoute && userRole !== 'vendor') {
      if (userDashboard) {
        const url = request.nextUrl.clone()
        url.pathname = userDashboard
        return NextResponse.redirect(url)
      }
    }

    // 4. Enforce access control for sales routes
    if (isSalesRoute && userRole !== 'sales_executive') {
      if (userDashboard) {
        const url = request.nextUrl.clone()
        url.pathname = userDashboard
        return NextResponse.redirect(url)
      }
    }

    // 5. Enforce access control for admin routes
    if (isAdminRoute && userRole !== 'admin') {
      if (userDashboard) {
        const url = request.nextUrl.clone()
        url.pathname = userDashboard
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
