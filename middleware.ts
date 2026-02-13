import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Routes that require completed consents before access
const CONSENT_REQUIRED_PREFIXES = ['/serate', '/game'];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (token) {
      const onboardingComplete = !!token.onboardingComplete;
      const hasAlias = !!token.alias;
      const consentsComplete = !!token.consentsComplete;

      // Allow access to onboarding-related pages without redirect loops
      const isOnboardingPage = pathname === '/onboarding';
      const isSetupAliasPage = pathname === '/setup-alias';
      const isConsentsPage = pathname === '/consents';
      const isPrivacyPage = pathname === '/privacy';
      const isTermsPage = pathname === '/terms';
      const isApiRoute = pathname.startsWith('/api');
      const isAdminRoute = pathname.startsWith('/admin');

      // Skip redirect logic for API routes, static/public pages, and flow pages
      if (isApiRoute || isPrivacyPage || isTermsPage) {
        return NextResponse.next();
      }

      // Step 1: User must complete onboarding first
      if (!onboardingComplete) {
        if (!isOnboardingPage) {
          return NextResponse.redirect(new URL('/onboarding', req.url));
        }
        return NextResponse.next();
      }

      // Step 2: User must set alias after onboarding
      if (!hasAlias) {
        if (!isSetupAliasPage) {
          return NextResponse.redirect(new URL('/setup-alias', req.url));
        }
        return NextResponse.next();
      }

      // Step 3: Consent gate — game routes require accepted consents
      const needsConsent = CONSENT_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));
      if (needsConsent && !consentsComplete && !isConsentsPage) {
        return NextResponse.redirect(new URL('/consents', req.url));
      }

      // Step 4: Admin routes require ADMIN role
      if (isAdminRoute && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Step 5: Fully onboarded users should not revisit onboarding/setup pages
      if (isOnboardingPage || isSetupAliasPage) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        if (pathname === '/') return true;
        if (pathname === '/login') return true;
        if (pathname === '/verify-request') return true;
        if (pathname === '/privacy') return true;
        if (pathname === '/terms') return true;
        if (pathname.startsWith('/api/auth')) return true;

        // Everything else requires authentication
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
