// Environment variable validation and security utilities
export const envConfig = {
  // Validate required environment variables
  validate: (): { valid: boolean; missing: string[] } => {
    const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const serverRequired = [
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missing: string[] = [];

    // Check client-side required vars
    required.forEach(key => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });

    // Check server-side required vars (only on server)
    if (typeof window === 'undefined') {
      serverRequired.forEach(key => {
        if (!process.env[key]) {
          missing.push(key);
        }
      });
    }

    return {
      valid: missing.length === 0,
      missing
    };
  },

  // Get validated Supabase URL
  getSupabaseUrl: (): string => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes('supabase')) {
        console.warn('Supabase URL does not appear to be a valid Supabase URL');
      }
      return url;
    } catch {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
    }
  },

  // Get validated anon key
  getAnonKey: (): string => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    }

    // Basic JWT format validation (should start with 'ey')
    if (!key.startsWith('ey')) {
      console.warn('Anon key does not appear to be a valid JWT');
    }

    return key;
  },

  // Get service role key (server-side only)
  getServiceRoleKey: (): string => {
    if (typeof window !== 'undefined') {
      throw new Error('Service role key should never be accessed on client-side');
    }

    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations');
    }

    // Basic JWT format validation
    if (!key.startsWith('ey')) {
      console.warn('Service role key does not appear to be a valid JWT');
    }

    return key;
  },

  // Get optional Redis config for rate limiting
  getRedisConfig: (): { url?: string; token?: string } => {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL || 'https://harmless-clam-14858.upstash.io',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AToKAAIjcDExN2Y2MjdkNDMwYmY0YzVhOTUyNWFiYWYwYjNkM2ZhMXAxMA'
    };
  },

  // Check if we're in production
  isProduction: (): boolean => {
    return process.env.NODE_ENV === 'production';
  },

  // Get app URL for redirects
  getAppUrl: (): string => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return process.env.NEXT_PUBLIC_APP_URL || 
           process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
           'http://localhost:3000';
  }
};

// Security configuration
export const securityConfig = {
  // Rate limiting configuration
  rateLimits: {
    api: { requests: 30, window: '1m' },
    auth: { requests: 5, window: '1m' },
    upload: { requests: 10, window: '1h' },
    pdf: { requests: 20, window: '1h' }
  },

  // File upload restrictions
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt']
  },

  // Session configuration
  session: {
    maxAge: 24 * 60 * 60, // 24 hours
    cookieName: 'supabase-auth-token',
    secure: envConfig.isProduction(),
    sameSite: 'lax' as const
  },

  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://checkout.stripe.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'img-src': ["'self'", "data:", "https:", "blob:"],
    'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
    'connect-src': [
      "'self'",
      "https://*.supabase.co",
      "https://latexonline.cc",
      "https://latex.ytotech.com",
      "wss://*.supabase.co"
    ],
    'frame-src': ["'self'", "https://checkout.stripe.com"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"]
  }
};

// Environment validation on module load
const validation = envConfig.validate();
if (!validation.valid) {
  console.error('Missing required environment variables:', validation.missing);
  if (envConfig.isProduction()) {
    throw new Error(`Missing required environment variables: ${validation.missing.join(', ')}`);
  }
}
