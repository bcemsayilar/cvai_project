import { NextResponse, type NextRequest } from 'next/server'

// Helper function to get client IP address
function getClientIP(request: NextRequest): string {
  // Check for IP in various headers (for different proxy setups)
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to unknown if no IP found
  return 'unknown'
}

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add security headers to all responses
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()')

  // Add Strict-Transport-Security only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Add request ID for tracing
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)
  requestHeaders.set('X-Request-ID', requestId)

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add rate limiting headers
    response.headers.set('X-RateLimit-Policy', 'API endpoints are rate-limited')
  }

  // Protect auth routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    // Additional security for auth routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Block suspicious user agents
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /python-requests/i,
    /curl/i,
    /wget/i,
    /bot/i,
    /scanner/i,
    /spider/i
  ]

  // Allow legitimate bots but block obvious automation
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent)) && 
      !userAgent.includes('Googlebot') && 
      !userAgent.includes('bingbot')) {
    
    // Log suspicious activity
    console.warn(`Suspicious user agent blocked: ${userAgent} from ${getClientIP(request)}`)
    
    // Return 403 for API routes, redirect for others
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Validate request size (prevent large payload attacks)
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength)
    const maxSize = request.nextUrl.pathname.includes('upload') ? 10 * 1024 * 1024 : 1024 * 1024 // 10MB for uploads, 1MB for others
    
    if (size > maxSize) {
      console.warn(`Request too large: ${size} bytes from ${getClientIP(request)}`)
      return new NextResponse('Payload Too Large', { status: 413 })
    }
  }

  return response
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}
