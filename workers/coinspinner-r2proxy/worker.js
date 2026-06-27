var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

const ALLOWED_ORIGIN = "https://coins.grailpulse.com";

const MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function cacheControlFor(key) {
  if (key.startsWith("price-summaries/")) {
    return "public, max-age=300, s-maxage=3600";
  }
  return "public, max-age=31536000, immutable";
}
__name(cacheControlFor, "cacheControlFor");

var worker_default = {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Origin check: browser requests must come from coins.grailpulse.com.
    // Server-side fetches (ISR, Node, scripts) send no Origin — allow those.
    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    const cache = caches.default;
    const hit = await cache.match(request);
    if (hit) return hit;

    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    if (!key) return new Response("Missing key", { status: 400 });

    const object = await env.ASSETS.get(key);
    if (!object) return new Response(`Not found: ${key}`, { status: 404 });

    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext] ?? "application/octet-stream";
    const response = new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControlFor(key),
        ...(origin ? { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } : {}),
        "X-CS-Cache": "MISS",
      },
    });
    ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
};

export default worker_default;
