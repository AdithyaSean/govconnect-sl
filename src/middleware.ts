import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // This value would ideally come from a remote config, database, or environment variable.
  // For this prototype, we can toggle it here to test the maintenance page.
  const isMaintenanceMode = false; 

  const { pathname } = request.nextUrl

  // If in maintenance mode, redirect all non-admin/worker traffic to the maintenance page.
  if (isMaintenanceMode && !pathname.startsWith('/admin') && !pathname.startsWith('/worker') && pathname !== '/maintenance') {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // If not in maintenance mode, but user tries to access /maintenance, redirect them to the dashboard.
  if (!isMaintenanceMode && pathname === '/maintenance') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
