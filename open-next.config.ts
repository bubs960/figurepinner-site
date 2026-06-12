import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * 2026-06-11 (S20 infra audit): defineCloudflareConfig() was previously called
 * with NO overrides, which compiles the DUMMY incremental cache and DUMMY
 * queue into the bundle — ISR was silently OFF in production. Every
 * revalidate export, every fetch next:{revalidate}, and the NEXT_INC_CACHE_KV
 * binding in wrangler.toml were inert; every edge-cache MISS ran full SSR
 * (the root cause of the 519ms avg CPU and 1.3-3.7s cold renders).
 *
 * - kvIncrementalCache: real ISR via the NEXT_INC_CACHE_KV binding
 *   (prefix "isr-cache", shared FP_KV namespace — both already configured).
 * - memoryQueue: stale-while-revalidate refresh; requires the
 *   WORKER_SELF_REFERENCE service binding in wrangler.toml.
 * - enableCacheInterception: serves cache hits from the routing layer
 *   without evaluating the 26MB server module (skips the KB parse tax).
 *
 * Deploy must run `opennextjs-cloudflare deploy` (package.json updated) so
 * the build-time prerender seed is populated into KV.
 * Rollback: revert this file to `defineCloudflareConfig()` + redeploy.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
  enableCacheInterception: true,
});
