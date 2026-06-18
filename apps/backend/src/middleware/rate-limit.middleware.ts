import { rateLimiter } from 'hono-rate-limiter';
import type { Context } from 'hono';

/**
 * Rate Limiting Middleware
 * 
 * Protects endpoints from abuse by limiting request frequency
 */

// Standard rate limit for most endpoints
export const standardRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per window
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) => {
    // Use IP address or user ID for rate limiting
    const userId = c.get('jwtPayload')?.id;
    const ip = c.req.header('cf-connecting-ip') || 
               c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    return userId || ip;
  },
  handler: (c: Context) => {
    return c.json({
      ok: false,
      error: 'Too many requests. Please try again later.',
    }, 429);
  },
});

// Strict rate limit for payment endpoints
export const paymentRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Only 5 payment requests per window
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) => {
    const userId = c.get('jwtPayload')?.id;
    const ip = c.req.header('cf-connecting-ip') || 
               c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    return userId || ip;
  },
  handler: (c: Context) => {
    return c.json({
      ok: false,
      error: 'Too many payment requests. Please wait before trying again.',
    }, 429);
  },
});

// Strict rate limit for authentication endpoints
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 login attempts per window
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) => {
    const ip = c.req.header('cf-connecting-ip') || 
               c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    return ip;
  },
  handler: (c: Context) => {
    return c.json({
      ok: false,
      error: 'Too many login attempts. Please try again later.',
    }, 429);
  },
});

// Very strict rate limit for password reset
export const passwordResetRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // Only 3 password reset requests per hour
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) => {
    const ip = c.req.header('cf-connecting-ip') || 
               c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    return ip;
  },
  handler: (c: Context) => {
    return c.json({
      ok: false,
      error: 'Too many password reset requests. Please try again later.',
    }, 429);
  },
});

// Moderate rate limit for payment verification
export const verificationRateLimit = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 20, // 20 verification requests per window
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) => {
    const userId = c.get('jwtPayload')?.id;
    const ip = c.req.header('cf-connecting-ip') || 
               c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    return userId || ip;
  },
  handler: (c: Context) => {
    return c.json({
      ok: false,
      error: 'Too many verification requests. Please wait before trying again.',
    }, 429);
  },
});
