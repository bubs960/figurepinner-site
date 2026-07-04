var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

const ALLOWED_ORIGIN = "https://figurepinner.com";

// S1 (hygiene plan, 2026-07-02, r2proxy side). This worker is the other open
// data faucet (the site-side half — price-check/funnel — is
// src/lib/rateLimit.ts). Only gates cache MISSES: a HIT already short-circuits
// before touching R2, so it needs no protection. Verified-bot traffic and
// origin-less requests (server-side ISR fetches from the Next app itself) are
// exempt — this throttles a single scraping IP hammering uncached R2 keys,
// not normal page loads (a photo-heavy page can legitimately fire dozens of
// GETs at once, most of which are cache HITs after the first visitor warms
// them).
//
// Live-verified 2026-07-04: the first cut used caches.default as a counter,
// which silently never persists on *.workers.dev (Cache API only functions
// on custom domains — Cloudflare docs) — every one of 130 burst requests
// against the deployed URL got 200, never a 429. Switched to the native
// Rate Limiting binding (RATE_LIMITER, see wrangler.toml), which works the
// same on workers.dev as on a zone.
const RATE_LIMIT_RETRY_AFTER_SECONDS = 60;

async function isRateLimited(request, env) {
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip) return false;
  if (request.cf?.verifiedBotCategory) return false;

  try {
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    return !success;
  } catch {
    return false; // Rate limiter unavailable — fail open, same law as before.
  }
}
__name(isRateLimited, "isRateLimited");

const MIME = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  json: "application/json",
  js: "application/javascript",
  css: "text/css",
};

function cacheControlFor(key) {
  if (key.startsWith("price-summaries/")) {
    return "public, max-age=300, s-maxage=3600";
  }
  return "public, max-age=31536000, immutable";
}
__name(cacheControlFor, "cacheControlFor");

function notFoundCacheControlFor(key) {
  if (key.startsWith("price-summaries/")) {
    return "public, max-age=300, s-maxage=300";
  }
  return "public, max-age=3600, s-maxage=3600";
}
__name(notFoundCacheControlFor, "notFoundCacheControlFor");

var worker_default = {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Origin check: browser requests must come from figurepinner.com.
    // Server-side fetches (ISR, Node, wrangler scripts) send no Origin — allow those.
    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    const cache = caches.default;
    const hit = await cache.match(request);
    if (hit) return hit;

    if (await isRateLimited(request, env)) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(RATE_LIMIT_RETRY_AFTER_SECONDS), "Cache-Control": "no-store" },
      });
    }

    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    if (!key) return new Response("Missing key", { status: 400 });

    const object = await env.ASSETS.get(key);
    if (!object) {
      const isPriceSummary = key.startsWith("price-summaries/");
      if (isPriceSummary) {
        const empty = new Response("{}", {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": notFoundCacheControlFor(key),
            ...(origin ? { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } : {}),
            "X-FP-Cache": "MISS-EMPTY",
          },
        });
        ctx.waitUntil(cache.put(request, empty.clone()));
        return empty;
      }
      return new Response(`Not found: ${key}`, {
        status: 404,
        headers: {
          "Cache-Control": notFoundCacheControlFor(key),
          ...(origin ? { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } : {}),
          "X-FP-Cache": "MISS-404",
        },
      });
    }

    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext] ?? "application/octet-stream";
    const response = new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControlFor(key),
        ...(origin ? { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } : {}),
        "X-FP-Cache": "MISS",
      },
    });
    ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
};

export default worker_default;
