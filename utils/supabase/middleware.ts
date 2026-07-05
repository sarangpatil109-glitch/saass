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

  // Redirect authenticated users away from login pages
  if (user && isAuthRoute && !pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard' // Layouts handle exact role routing
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
