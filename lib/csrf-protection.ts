// CSRF Protection utilities
import { headers } from 'next/headers';

export class CSRFProtection {
  private static readonly CSRF_HEADER = 'x-csrf-token';
  private static readonly CSRF_COOKIE = 'csrf-token';

  // Generate a secure CSRF token
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate CSRF token for state-changing operations
  static async validateRequest(request: Request): Promise<{ valid: boolean; error?: string }> {
    const method = request.method.toUpperCase();
    
    // Only validate for state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return { valid: true };
    }

    const headerToken = request.headers.get(this.CSRF_HEADER);
    const cookies = request.headers.get('cookie');
    
    if (!headerToken) {
      return { valid: false, error: 'CSRF token missing in headers' };
    }

    if (!cookies) {
      return { valid: false, error: 'CSRF token missing in cookies' };
    }

    // Extract token from cookies
    const csrfCookieMatch = cookies.match(new RegExp(`${this.CSRF_COOKIE}=([^;]+)`));
    const cookieToken = csrfCookieMatch?.[1];

    if (!cookieToken) {
      return { valid: false, error: 'CSRF token missing in cookies' };
    }

    if (headerToken !== cookieToken) {
      return { valid: false, error: 'CSRF token mismatch' };
    }

    return { valid: true };
  }

  // Verify referrer for additional CSRF protection
  static validateReferrer(request: Request): { valid: boolean; error?: string } {
    const referrer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Allow requests without referrer for API clients (with proper CSRF token)
    if (!referrer && !origin) {
      return { valid: true };
    }

    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // Allow for development
    ];

    const requestOrigin = origin || (referrer ? new URL(referrer).origin : null);

    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
      return { valid: false, error: 'Invalid origin or referrer' };
    }

    return { valid: true };
  }

  // Complete CSRF validation (token + referrer)
  static async validateComplete(request: Request): Promise<{ valid: boolean; error?: string }> {
    const tokenValidation = await this.validateRequest(request);
    if (!tokenValidation.valid) {
      return tokenValidation;
    }

    const referrerValidation = this.validateReferrer(request);
    if (!referrerValidation.valid) {
      return referrerValidation;
    }

    return { valid: true };
  }
}

// Middleware helper for API routes
export function withCSRFProtection(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    // Skip CSRF validation for GET and HEAD requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return handler(req);
    }

    const validation = await CSRFProtection.validateComplete(req);
    
    if (!validation.valid) {
      console.warn(`CSRF validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(req);
  };
}

// React hook for CSRF token management
export const useCSRF = () => {
  if (typeof window === 'undefined') {
    return { token: null, setToken: () => {} };
  }

  const getToken = (): string | null => {
    const cookies = document.cookie;
    const match = cookies.match(/csrf-token=([^;]+)/);
    return match ? match[1] : null;
  };

  const setToken = (token: string) => {
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `csrf-token=${token}; path=/${isSecure ? '; secure' : ''}; samesite=lax`;
  };

  const generateAndSetToken = (): string => {
    const token = CSRFProtection.generateToken();
    setToken(token);
    return token;
  };

  return {
    token: getToken(),
    setToken,
    generateAndSetToken,
  };
};
