import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { envConfig } from "./env-config";

// In-memory fallback for rate limiting when Redis is not available
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async limit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const resetTime = now + windowMs;
    const existing = this.store.get(key);

    if (!existing || existing.resetTime < now) {
      // New window or expired window
      this.store.set(key, { count: 1, resetTime });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: new Date(resetTime)
      };
    }

    if (existing.count >= limit) {
      // Limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(existing.resetTime)
      };
    }

    // Increment count
    existing.count++;
    this.store.set(key, existing);

    return {
      success: true,
      limit,
      remaining: limit - existing.count,
      reset: new Date(existing.resetTime)
    };
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

// Global memory store instance
const memoryStore = new MemoryStore();

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => memoryStore.cleanup(), 5 * 60 * 1000);
}

// Convert window string to Duration format expected by Upstash
function convertToDuration(window: string): Duration {
  // Upstash expects format like "1 s", "10 m", "1 h", "1 d" (with space)
  const match = window.match(/^(\d+)\s*([smhd])$/);
  if (!match) return "1 m" as Duration; // Default 1 minute
  
  const value = match[1];
  const unit = match[2];
  
  return `${value} ${unit}` as Duration;
}

// Create rate limiter with Redis or memory fallback
function createRateLimiter(requests: number, window: string) {
  const redisConfig = envConfig.getRedisConfig();
  
  if (redisConfig.url && redisConfig.token) {
    try {
      return new Ratelimit({
        redis: new Redis({
          url: redisConfig.url,
          token: redisConfig.token,
        }),
        limiter: Ratelimit.slidingWindow(requests, convertToDuration(window)),
        analytics: true,
      });
    } catch (error) {
      console.warn('Failed to create Redis rate limiter, falling back to memory:', error);
    }
  }

  // Fallback to memory-based rate limiting
  const windowMs = parseWindow(window);
  return {
    limit: async (identifier: string) => {
      return memoryStore.limit(identifier, requests, windowMs);
    }
  };
}

// Parse window string to milliseconds
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*([smhd])$/);
  if (!match) return 60000; // Default 1 minute

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 60000;
  }
}

// Create a new ratelimiter that allows different limits for different endpoints
export const rateLimit = {
  // General API rate limit - 30 requests per minute
  api: createRateLimiter(30, "1m"),

  // Auth endpoints - 5 attempts per minute
  auth: createRateLimiter(5, "1m"),

  // File upload - 10 uploads per hour
  upload: createRateLimiter(10, "1h"),

  // PDF generation - 20 generations per hour (more intensive)
  pdf: createRateLimiter(20, "1h"),
};

// Middleware function to check rate limits
export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof rateLimit
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  try {
    const result = await rateLimit[limitType].limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset instanceof Date ? result.reset : new Date(result.reset),
    };
  } catch (error) {
    console.error(`Rate limit check failed for ${limitType}:`, error);
    // Fail open in case of connection issues
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }
}

// Helper to get client identifier (IP + user ID when available)
export function getClientIdentifier(req: Request, userId?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
  
  // Use user ID if available for authenticated requests, otherwise use IP
  return userId ? `user:${userId}` : `ip:${ip}`;
}
