import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis for rate limiting
const redis = process.env.REDIS_URL
  ? new Redis({ url: process.env.REDIS_URL })
  : null;

// Rate limiters for different endpoints
const createRatelimit = (requests: number, window: string) =>
  redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  }) : null;

const rateLimiters = {
  // General API rate limiting
  api: createRatelimit(100, '1 m'), // 100 requests per minute

  // Authentication endpoints
  auth: createRatelimit(10, '1 m'), // 10 login attempts per minute

  // Payment endpoints (stricter)
  payment: createRatelimit(20, '1 m'), // 20 payment requests per minute

  // File upload endpoints
  upload: createRatelimit(10, '1 m'), // 10 uploads per minute

  // Message sending
  messaging: createRatelimit(30, '1 m'), // 30 messages per minute

  // Search endpoints
  search: createRatelimit(50, '1 m'), // 50 searches per minute
};

// Security headers configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.cloudinary.com https://*.googleapis.com https://*.gstatic.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.sentry.io https://www.google-analytics.com",
    "frame-src 'self' https://js.stripe.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
};

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/booking',
  '/messages',
  '/profile',
  '/payment',
  '/contracts'
];

// Admin-only routes
const adminRoutes = [
  '/admin'
];

// API routes that need rate limiting
const rateLimitedRoutes = [
  { path: '/api/auth', limiter: 'auth' },
  { path: '/api/payments', limiter: 'payment' },
  { path: '/api/upload', limiter: 'upload' },
  { path: '/api/messages', limiter: 'messaging' },
  { path: '/api/search', limiter: 'search' },
  { path: '/api', limiter: 'api' }, // Catch-all for other API routes
];

// Input validation patterns
const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  price: /^\d+(\.\d{1,2})?$/,
};

// Validate request inputs
function validateInput(req: NextRequest): boolean {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Validate common query parameters
    const email = searchParams.get('email');
    if (email && !validationPatterns.email.test(email)) {
      return false;
    }

    const phone = searchParams.get('phone');
    if (phone && !validationPatterns.phone.test(phone)) {
      return false;
    }

    const price = searchParams.get('price') || searchParams.get('amount');
    if (price && !validationPatterns.price.test(price)) {
      return false;
    }

    // Check for common injection patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /union\s+select/i,
      /drop\s+table/i,
    ];

    const queryString = url.search;
    for (const pattern of dangerousPatterns) {
      if (pattern.test(queryString)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Input validation error:', error);
    return false;
  }
}

// Apply rate limiting
async function applyRateLimit(req: NextRequest, limiterKey: keyof typeof rateLimiters): Promise<boolean> {
  if (!rateLimiters[limiterKey]) return true;

  const identifier = getClientIP(req);
  const { success, limit, reset, remaining } = await rateLimiters[limiterKey]!.limit(identifier);

  if (!success) {
    console.warn(`Rate limit exceeded for ${identifier} on ${req.nextUrl.pathname}`);
  }

  return success;
}

// Get client IP address
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return req.ip || 'unknown';
}

// CSRF token validation
function validateCSRFToken(req: NextRequest): boolean {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return true; // CSRF protection not needed for safe methods
  }

  const token = req.headers.get('x-csrf-token');
  const cookie = req.cookies.get('csrf-token');

  if (!token || !cookie || token !== cookie.value) {
    console.warn('CSRF token validation failed');
    return false;
  }

  return true;
}

// Check if user has required permissions
async function checkPermissions(req: NextRequest, requiredRole?: 'admin' | 'landlord' | 'tenant'): Promise<boolean> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) return false;

    if (requiredRole === 'admin') {
      return token.role === 'admin';
    }

    if (requiredRole) {
      return token.userType === requiredRole;
    }

    return true; // User is authenticated
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Input validation
  if (!validateInput(req)) {
    console.warn(`Invalid input detected from ${getClientIP(req)}: ${pathname}`);
    return new NextResponse('Bad Request', { status: 400 });
  }

  // CSRF protection for API routes
  if (pathname.startsWith('/api/') && !validateCSRFToken(req)) {
    return new NextResponse('CSRF token invalid', { status: 403 });
  }

  // Rate limiting for API routes
  for (const route of rateLimitedRoutes) {
    if (pathname.startsWith(route.path)) {
      const allowed = await applyRateLimit(req, route.limiter as keyof typeof rateLimiters);
      if (!allowed) {
        return new NextResponse('Rate limit exceeded', {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
          }
        });
      }
      break;
    }
  }

  // Authentication checks for protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute || isAdminRoute) {
    const hasAccess = await checkPermissions(req, isAdminRoute ? 'admin' : undefined);

    if (!hasAccess) {
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Add CSRF token to response for forms
  if (pathname.includes('/auth/') || pathname.includes('/payment/')) {
    const csrfToken = crypto.randomUUID();
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  // Logging for monitoring
  if (process.env.NODE_ENV === 'production') {
    console.log(`${req.method} ${pathname} - ${getClientIP(req)} - ${new Date().toISOString()}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
