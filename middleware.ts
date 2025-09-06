import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from './src/lib/auth';

export async function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const user = await AuthService.authenticateRequest(request);
    
    if (!user) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect API routes that require authentication
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const user = await AuthService.authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};