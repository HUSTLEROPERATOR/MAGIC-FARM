import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // If user is authenticated
    if (token) {
      // If user has no alias and is not on setup-alias page, redirect to setup
      const userAlias = (token as any).alias;
      
      if (!userAlias && !pathname.startsWith('/setup-alias') && !pathname.startsWith('/api')) {
        // Allow access to setup-alias
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/library') || pathname.startsWith('/leaderboard')) {
          return NextResponse.redirect(new URL('/setup-alias', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicPaths = ['/', '/login', '/verify-request', '/api/auth'];
        
        if (publicPaths.some((path) => pathname.startsWith(path) || pathname === path)) {
          return true;
        }

        // For protected routes, require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
};
