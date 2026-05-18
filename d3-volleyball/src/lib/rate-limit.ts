/**
 * Simple in-memory rate limiter.
 * Works great for single-server deployments (Render free tier).
 * For multi-server: replace Map with Redis.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

type RateLimitOptions = {
  maxRequests: number;   // max requests allowed
  windowMs: number;      // time window in milliseconds
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  // Clean up expired entry
  if (entry && entry.resetAt < now) {
    store.delete(key);
  }

  const current = store.get(key);

  if (!current) {
    // First request in window
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (current.count >= options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count++;
  return {
    success: true,
    remaining: options.maxRequests - current.count,
    resetAt: current.resetAt,
  };
}

// ── Pre-configured limiters ────────────────────────────────────

// Auth endpoints: 10 attempts per 15 minutes
export function authRateLimit(ip: string) {
  return rateLimit(`auth:${ip}`, { maxRequests: 10, windowMs: 15 * 60 * 1000 });
}

// Registration: 5 per hour per IP
export function registerRateLimit(ip: string) {
  return rateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
}

// Game registration: 20 per minute per user
export function gameActionRateLimit(userId: string) {
  return rateLimit(`game:${userId}`, { maxRequests: 20, windowMs: 60 * 1000 });
}

// Admin actions: 100 per minute
export function adminRateLimit(adminId: string) {
  return rateLimit(`admin:${adminId}`, { maxRequests: 100, windowMs: 60 * 1000 });
}