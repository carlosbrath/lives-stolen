/**
 * Simple in-memory rate limiter for public endpoints
 * For production, consider using Redis or a dedicated rate limiting service
 */

// Store for rate limit tracking: { key: { count, resetTime } }
const rateLimitStore = new Map();

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // 1 hour

/**
 * Rate limit check
 * @param {string} identifier - Unique identifier (IP, email, etc.)
 * @param {number} maxRequests - Maximum requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{allowed: boolean, remaining: number, resetTime: number}}
 */
export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  let data = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!data || data.resetTime < now) {
    data = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, data);
  }

  // Increment request count
  data.count++;

  const allowed = data.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - data.count);

  return {
    allowed,
    remaining,
    resetTime: data.resetTime,
  };
}

/**
 * Get client IP from request
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  // Check various headers that might contain the real IP
  const headers = request.headers;

  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-client-ip") ||
    "unknown"
  );
}

/**
 * Rate limit middleware for Remix loaders/actions
 * @param {Request} request
 * @param {Object} options
 * @returns {Response|null} Returns Response if rate limited, null if allowed
 */
export function rateLimitByIp(
  request,
  { maxRequests = 10, windowMs = 60 * 60 * 1000, message = "Too many requests" } = {}
) {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, maxRequests, windowMs);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: message,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
        },
      }
    );
  }

  return null;
}

/**
 * Rate limit by email address (for form submissions)
 * @param {string} email
 * @param {Object} options
 * @returns {{allowed: boolean, remaining: number, resetTime: number}}
 */
export function rateLimitByEmail(
  email,
  { maxRequests = 3, windowMs = 24 * 60 * 60 * 1000 } = {} // 3 submissions per day by default
) {
  return checkRateLimit(`email:${email.toLowerCase()}`, maxRequests, windowMs);
}

/**
 * Combined rate limiting: both IP and email
 * @param {Request} request
 * @param {string} email
 * @param {Object} options
 * @returns {Response|null}
 */
export function rateLimitSubmission(request, email, options = {}) {
  const {
    ipMaxRequests = 20, // 20 submissions per hour per IP
    ipWindowMs = 60 * 60 * 1000,
    emailMaxRequests = 3, // 3 submissions per day per email
    emailWindowMs = 24 * 60 * 60 * 1000,
  } = options;

  // Check IP-based rate limit
  const ipLimit = rateLimitByIp(request, {
    maxRequests: ipMaxRequests,
    windowMs: ipWindowMs,
    message: "Too many submissions from your location. Please try again later.",
  });

  if (ipLimit) {
    return ipLimit;
  }

  // Check email-based rate limit
  const emailResult = rateLimitByEmail(email, {
    maxRequests: emailMaxRequests,
    windowMs: emailWindowMs,
  });

  if (!emailResult.allowed) {
    return new Response(
      JSON.stringify({
        error: `You can only submit ${emailMaxRequests} stories per day. Please try again later.`,
        retryAfter: Math.ceil((emailResult.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((emailResult.resetTime - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": emailMaxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(emailResult.resetTime).toISOString(),
        },
      }
    );
  }

  return null;
}
