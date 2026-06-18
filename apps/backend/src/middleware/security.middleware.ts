import { secureHeaders } from 'hono/secure-headers';
import type { Context, Next } from 'hono';

/**
 * Security Headers Middleware
 * 
 * Adds security headers to all responses to protect against common attacks
 */

export const securityHeadersMiddleware = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://api.paystack.co"],
    fontSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  xXssProtection: '1; mode=block',
});

/**
 * Request validation middleware
 * Validates common security concerns in requests
 */
export const requestValidationMiddleware = async (c: Context, next: Next) => {
  // Validate content-type for POST/PUT/PATCH requests
  const method = c.req.method;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = c.req.header('content-type');
    
    // Allow JSON and form data
    if (contentType && 
        !contentType.includes('application/json') && 
        !contentType.includes('multipart/form-data') &&
        !contentType.includes('application/x-www-form-urlencoded')) {
      return c.json({
        ok: false,
        error: 'Invalid content-type',
      }, 415);
    }
  }

  // Check for suspicious user agents (basic bot detection)
  const userAgent = c.req.header('user-agent');
  if (!userAgent || userAgent.length < 10) {
    console.warn('Suspicious request: Missing or invalid user agent', {
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
      path: c.req.path,
    });
  }

  await next();
};

/**
 * Input sanitization middleware
 * Sanitizes common injection attack patterns
 */
export const inputSanitizationMiddleware = async (c: Context, next: Next) => {
  // Get request body if it exists
  const method = c.req.method;
  
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const contentType = c.req.header('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await c.req.json();
        
        // Check for SQL injection patterns
        const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi;
        
        // Check for XSS patterns
        const xssPattern = /<script|javascript:|onerror=|onload=/gi;
        
        const checkValue = (value: any): boolean => {
          if (typeof value === 'string') {
            if (sqlInjectionPattern.test(value) || xssPattern.test(value)) {
              return false;
            }
          } else if (typeof value === 'object' && value !== null) {
            for (const key in value) {
              if (!checkValue(value[key])) {
                return false;
              }
            }
          }
          return true;
        };
        
        if (!checkValue(body)) {
          console.warn('Suspicious input detected', {
            ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
            path: c.req.path,
          });
          
          return c.json({
            ok: false,
            error: 'Invalid input detected',
          }, 400);
        }
      }
    } catch (error) {
      // If we can't parse the body, let the route handler deal with it
      console.error('Error in input sanitization:', error);
    }
  }

  await next();
};
