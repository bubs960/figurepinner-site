import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import kvIncrementalCacheWithTtl from "@/lib/kv-incremental-cache-ttl";

/**
 * 2026-06-11 (S20 infra audit): defineCloudflareConfig() was previously called
 * with NO overrides, which compiles the DUMMY incremental cache and DUMMY
 * queue into the bundle — ISR was silently OFF in production. Every
 * revalidate export, every fetch next:{revalidate}, and the NEXT_INC_CACHE_KV
 * binding in wrangler.toml were inert; every edge-cache MISS ran full SSR
 * (the root cause of the 519ms avg CPU and 1.3-3.7s cold renders).
 *
 * - kvIncrementalCacheWithTtl (2026-07-19, KV-growth fix): a local override
 *   of the vendor `kvIncrementalCache`, NOT the vendor import directly — the
 *   vendor's `set()` never passes a TTL on `kv.put()` (its own source still
 *   has a `// TODO: Figure out how to best leverage KV's TTL` comment as of
 *   today), so every ISR/fetch cache entry lived in FP_KV forever, which is
 *   what crossed Steve's 15,000-key escalation bar. See
 *   src/lib/kv-incremental-cache-ttl.ts for the full reasoning and
 *   Bridge/STANDALONE-TO-WEB-KV-TTL-FIX-WORK-ORDER-2026-07-19.md for the
 *   work order. DO NOT revert this back to the plain vendor import — that
 *   would silently reintroduce unbounded KV growth. Still real ISR via the
 *   same NEXT_INC_CACHE_KV binding (prefix "isr-cache", shared FP_KV
 *   namespace — both already configured); only the TTL behavior changed.
 * - memoryQueue: stale-while-revalidate refresh; requires the
 *   WORKER_SELF_REFERENCE service binding in wrangler.toml.
 * - enableCacheInterception: serves cache hits from the routing layer
 *   without evaluating the 26MB server module (skips the KB parse tax).
 *
 * Deploy must run `opennextjs-cloudflare deploy` (package.json updated) so
 * the build-time prerender seed is populated into KV.
 * Rollback: revert incrementalCache to the vendor
 * `@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache`
 * import + redeploy — but that reintroduces the unbounded-growth bug, so only
 * do this as a genuine emergency rollback, not routine maintenance.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCacheWithTtl,
  queue: memoryQueue,
  enableCacheInterception: true,
});
