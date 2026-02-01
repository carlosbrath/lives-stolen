// In-memory rate limiter (use Redis in production for multi-instance deployments)

const store = new Map();

// Cleanup old entries hourly
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (data.resetTime < now) store.delete(key);
  }
}, 60 * 60 * 1000);

function checkRateLimit(identifier, maxRequests, windowMs) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  let data = store.get(key);

  if (!data || data.resetTime < now) {
    data = { count: 0, resetTime: now + windowMs };
    store.set(key, data);
  }

  data.count++;
  return {
    allowed: data.count <= maxRequests,
    remaining: Math.max(0, maxRequests - data.count),
    resetTime: data.resetTime,
  };
}

export function getClientIp(request) {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-client-ip") ||
    "unknown"
  );
}

export function rateLimitByIp(request, options = {}) {
  const { maxRequests = 10, windowMs = 3600000, message = "Too many requests" } = options;
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, maxRequests, windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ error: message, retryAfter }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
        },
      }
    );
  }

  return null;
}

export function rateLimitByEmail(email, options = {}) {
  const { maxRequests = 3, windowMs = 86400000 } = options; // 3 per day default
  return checkRateLimit(`email:${email.toLowerCase()}`, maxRequests, windowMs);
}

export function rateLimitSubmission(request, email, options = {}) {
  const {
    ipMaxRequests = 20,
    ipWindowMs = 3600000,
    emailMaxRequests = 3,
    emailWindowMs = 86400000,
  } = options;

  // Check IP limit
  const ipLimit = rateLimitByIp(request, {
    maxRequests: ipMaxRequests,
    windowMs: ipWindowMs,
    message: "Too many submissions from your location. Please try again later.",
  });
  if (ipLimit) return ipLimit;

  // Check email limit
  const emailResult = rateLimitByEmail(email, {
    maxRequests: emailMaxRequests,
    windowMs: emailWindowMs,
  });

  if (!emailResult.allowed) {
    const retryAfter = Math.ceil((emailResult.resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: `You can only submit ${emailMaxRequests} stories per day. Please try again later.`,
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": emailMaxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(emailResult.resetTime).toISOString(),
        },
      }
    );
  }

  return null;
}
