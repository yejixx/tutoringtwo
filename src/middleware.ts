import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Protected routes that require authentication AND email verification
const protectedRoutes = [
  '/dashboard',
  '/tutor',
  '/bookings',
  '/settings',
  '/messages',
];

// Routes that require authentication but NOT email verification
const authOnlyRoutes = [
  '/verify-email',
];

// Auth routes (redirect to dashboard if already logged in)
const authRoutes = ['/login', '/register'];

// Routes that require email verification to access
const verificationRequiredRoutes = [
  '/dashboard',
  '/tutor',
  '/bookings',
  '/messages',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session
  const session = await auth();
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route requires email verification
  const requiresVerification = verificationRequiredRoutes.some(route =>
    pathname.startsWith(route)
  );
  
  // Check if it's an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    loginUrl.searchParams.set('message', 'Please sign in to access this page');
    return NextResponse.redirect(loginUrl);
  }

  // Check email verification for protected routes
  if (session && requiresVerification && !(session.user as any).emailVerified) {
    // Redirect to a verification required page
    const verifyUrl = new URL('/verify-email-required', request.url);
    verifyUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(verifyUrl);
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && session) {
    // If logged in but not verified, allow access to complete verification
    if (!(session.user as any).emailVerified) {
      // Allow them to stay on auth routes to potentially resend verification
      const response = NextResponse.next();
      return response;
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Security Headers
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (restrict browser features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy (basic - adjust as needed)
  // Note: In production, make this more restrictive
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.stripe.com https://*.neon.tech",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    );

    // HTTP Strict Transport Security (only in production)
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (they have their own handling)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
