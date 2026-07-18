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
 * RUNTIME-VERIFIED 2026-07-02 (live, post-deploy): the original fire-and-
 * forget `void cache.put(...)` never persisted the counter — the Workers
 * runtime cancels floating promises once the response returns, so 38
 * requests inside one aligned 60s window produced zero 429s. The put must
 * be awaited (see below). Re-verify with a >limit curl burst after any
 * change to this file.
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
 *               A `NextRequest` (middleware) satisfies this too, so this
 *               same function is also called directly from `middleware.ts`
 *               for the figure-page-HTML guard (2026-07-18 Data Defense
 *               Layer 2) — no separate Server-Component code path needed.
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

    // MUST await this put. The Workers runtime cancels floating promises
    // when the response returns, so a fire-and-forget write never persists
    // the counter — verified live 2026-07-02: 38 requests in one aligned
    // window produced zero 429s. The put is colo-local (single-digit ms);
    // if the write must leave the request path, it needs ctx.waitUntil,
    // which route handlers don't have here.
    await cache.put(
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
