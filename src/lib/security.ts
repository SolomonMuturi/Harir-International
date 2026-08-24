import { NextRequest, NextResponse } from 'next/server';

// Edge-safe helpers used by middleware.ts for CSRF protection and rate limiting.
// IMPORTANT: these are in-memory counters. On a single instance they work as
// expected; when scaling horizontally each isolate keeps its own counters, so
// consider an external store (e.g. Upstash Redis) before multi-instance deploys.

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function isStateChanging(method: string): boolean {
  return STATE_CHANGING_METHODS.includes(method.toUpperCase());
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly max: number
  ) {}

  check(key: string): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const timestamps = (this.hits.get(key) || []).filter((t) => t > cutoff);

    if (timestamps.length >= this.max) {
      this.hits.set(key, timestamps);
      const retryAfter = Math.max(1, Math.ceil((timestamps[0] + this.windowMs - now) / 1000));
      return { allowed: false, retryAfter };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return { allowed: true, retryAfter: 0 };
  }
}

// Brute-force guard for login/sign-in attempts.
export const authRateLimiter = new SlidingWindowRateLimiter(60_000, 10);
// General API request cap (read-heavy pages like the outbound dashboard fire many GETs).
export const apiRateLimiter = new SlidingWindowRateLimiter(60_000, 300);
// Stricter cap for state-changing API requests (creates/updates/deletes).
export const mutationRateLimiter = new SlidingWindowRateLimiter(60_000, 60);

function csrfForbidden(): NextResponse {
  return NextResponse.json(
    { error: 'Forbidden', message: 'Cross-site request blocked (CSRF protection).' },
    { status: 403 }
  );
}

function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

/**
 * CSRF defense for state-changing requests. Blocks cross-site browser requests
 * by validating the Origin header (when present) against the request host, and
 * rejecting requests flagged as cross-site by Sec-Fetch-Site. Combined with
 * SameSite=Lax session cookies this closes the main CSRF vectors. Requests from
 * non-browser clients (no Origin / Sec-Fetch-Site headers) are allowed through.
 *
 * Returns a 403 NextResponse to block the request, or null to allow it.
 */
export function enforceCsrf(request: NextRequest): NextResponse | null {
  if (!isStateChanging(request.method)) return null;

  const host = request.nextUrl.host;
  const origin = request.headers.get('origin');
  const secFetchSite = request.headers.get('sec-fetch-site');

  if (origin) {
    // 'null' origin is sent by sandboxed iframes / data: URLs — never legit for state changes.
    if (origin === 'null') {
      return csrfForbidden();
    }

    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      return csrfForbidden();
    }

    if (originHost !== host) {
      return csrfForbidden();
    }
  } else if (secFetchSite === 'cross-site') {
    return csrfForbidden();
  }

  return null;
}

/**
 * Rate limiting for API routes. Returns a 429 NextResponse when a client exceeds
 * the allowed rate, or null to allow the request.
 */
export function enforceRateLimit(request: NextRequest): NextResponse | null {
  if (!request.nextUrl.pathname.startsWith('/api')) return null;

  const ip = getClientIp(request);
  const path = request.nextUrl.pathname;
  const changing = isStateChanging(request.method);

  if (path.startsWith('/api/auth') && changing) {
    const result = authRateLimiter.check(`auth:${ip}`);
    return result.allowed ? null : tooManyRequests(result.retryAfter);
  }

  if (changing) {
    const result = mutationRateLimiter.check(`mut:${ip}`);
    return result.allowed ? null : tooManyRequests(result.retryAfter);
  }

  const result = apiRateLimiter.check(`api:${ip}`);
  return result.allowed ? null : tooManyRequests(result.retryAfter);
}
