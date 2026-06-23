import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Protected dashboard pages
  const protectedPaths = [
    '/dashboard', '/orders', '/customers', '/leads',
    '/pipeline', '/invoices', '/reports', '/master-data',
    '/settings', '/create-order', '/production', '/products',
  ]

  // Protected API routes
  const protectedApiPaths = [
    '/api/customers', '/api/orders', '/api/dashboard',
    '/api/invoices', '/api/master-data', '/api/leads',
    '/api/production', '/api/products', '/api/reports',
  ]

  const isProtected =
    protectedPaths.some(p => pathname.startsWith(p)) ||
    protectedApiPaths.some(p => pathname.startsWith(p))

  // Redirect unauthenticated users to login
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|padigiling.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
