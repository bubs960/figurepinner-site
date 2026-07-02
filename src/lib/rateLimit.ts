/**
 * Fixed-window per-IP rate limiter (S45 hygiene plan S1/S3, 2026-07-02).
 *
 * WHY Cache API and not KV: this guards public data endpoints
 * (/api/v1/price-check, /api/funnel) against abuse. KV is eventually
 * consistent globally and itself rate-limited (~1 write/sec/key) — wrong
 * tool for a counter that increments on every request. The colo-local
 * Cache API is per-datacenter, not global, so a distributed abuser spread
 * across colos gets a higher effective ceiling than the nominal limit.
 * That's an accepted tradeoff per the plan ("per-colo approximate — fine
 * for abuse throttling, not a DDoS defense" — CF's network-layer protection
 * is the backstop for volumetric attacks).
 *
 * NOT ATOMIC: match() then put() is a read-modify-write with no lock, so
 * concurrent requests inside the same window can under-count. Acceptable
 * for "throttle obvious abuse," not for billing-grade accuracy.
 *
 * NO CUSTOM CF WAF RULES — this lives in worker code per standing law
 * (feedback_no_cf_waf_rules.md), not the CF dashboard.
 *
 * Verified-bot exemption: request.cf.verifiedBotCategory traffic is NEVER
 * throttled — the G1 lesson (WEB-GOOGLEBOT-403-CONFIRMED-2026-07-02),
 * inverted. Do not remove this without re-reading that verdict.
 *
 * ⚠️ UNVERIFIED AT WRITE TIME (2026-07-02): sandbox had no node_modules /
 * shell access to `tsc` this session, so the `.cf` access on NextRequest and
 * the `caches.default` global below are written to the documented Workers
 * API shape but have NOT been type-checked or runtime-tested. Run `npm run
 * build` (or at minimum `tsc --noEmit`) before deploying, and hit
 * /api/v1/price-check from curl in a loop to confirm 429s actually fire.
 */

const WINDOW_SECONDS = 60

export interface RateLimitResult {
  limited: boolean
  remaining: number
  retryAfter: number
}

interface CfProps {
  verifiedBotCategory?: string
}

function ipFrom(req: Request): string {
  // CF overwrites this header from the internet edge — not client-spoofable.
  return req.headers.get('cf-connecting-ip') ?? ''
}

function isVerifiedBot(req: Request): boolean {
  const cf = (req as unknown as { cf?: CfProps }).cf
  return Boolean(cf?.verifiedBotCategory)
}

/**
 * @param req    incoming request — needs the cf-connecting-ip header and
 *               (ideally) the Workers `.cf` object for the bot exemption.
 * @param bucket logical namespace so routes don't share one counter, e.g.
 *               'price-check', 'funnel'.
 * @param limit  max requests per 60s window per IP.
 */
export async function checkRateLimit(req: Request, bucket: string, limit: number): Promise<RateLimitResult> {
  if (isVerifiedBot(req)) {
    return { limited: false, remaining: limit, retryAfter: 0 }
  }

  const ip = ipFrom(req)
  if (!ip) {
    // Can't key a counter without an IP — fail open rather than throttle
    // everyone behind a proxy that strips the header.
    return { limited: false, remaining: limit, retryAfter: 0 }
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const windowStart = Math.floor(nowSeconds / WINDOW_SECONDS) * WINDOW_SECONDS
  const key = new Request(`https://ratelimit.internal/${bucket}/${ip}/${windowStart}`)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache = (caches as any).default as Cache
    const cached = await cache.match(key)
    const count = cached ? Number(await cached.text()) || 0 : 0
    const next = count + 1

    // Fire-and-forget write — never block the request path on the counter.
    void cache.put(
      key,
      new Response(String(next), { headers: { 'Cache-Control': `max-age=${WINDOW_SECONDS}` } }),
    )

    if (next > limit) {
      const retryAfter = Math.max(WINDOW_SECONDS - (nowSeconds - windowStart), 1)
      return { limited: true, remaining: 0, retryAfter }
    }
    return { limited: false, remaining: Math.max(limit - next, 0), retryAfter: 0 }
  } catch {
    // Cache API unavailable (local dev, or a Workers runtime quirk) — fail
    // open. A broken rate limiter should never break the user path.
    return { limited: false, remaining: limit, retryAfter: 0 }
  }
}
