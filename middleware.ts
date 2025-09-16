import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes
const protectedRoutes = ['/admin']

// Simple middleware for redirecting to login if not authenticated
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) && pathname !== '/admin/login'
  )
  
  // Since we can't access localStorage in middleware, we'll let the client handle authentication
  // This middleware just ensures the routes exist
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ['/admin/:path*'],
}