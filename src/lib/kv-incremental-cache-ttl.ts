import { error } from "@opennextjs/aws/adapters/logger.js";
import type {
  CacheEntryType,
  CacheValue,
  IncrementalCache,
  WithLastModified,
} from "@opennextjs/aws/types/overrides.js";
import { IgnorableError } from "@opennextjs/aws/utils/error.js";

import { getCloudflareContext } from "@opennextjs/cloudflare/cloudflare-context";
import {
  computeCacheKey,
  debugCache,
  type IncrementalCacheEntry,
} from "@opennextjs/cloudflare/overrides/internal";

// KV-growth fix (standalone work order, 2026-07-19): the vendor
// `KVIncrementalCache` (@opennextjs/cloudflare, installed 1.19.1 -- confirmed
// unchanged as of the package's own `main` branch on 2026-07-19, still
// carrying its own `// TODO: Figure out how to best leverage KV's TTL.`
// comment) never passes a TTL on `kv.put()`. Every page/fetch cache entry
// this site has ever written lives in FP_KV forever, which is the entire
// reason the namespace crossed Steve's 15,000-key escalation bar the same
// day this was written, with no cap in sight (theoretical current-build
// ceiling in the ~90K range at full catalog coverage). Steve's ruling: fix
// the mechanism, don't monitor it -- see
// Bridge/STANDALONE-TO-WEB-KV-TTL-FIX-WORK-ORDER-2026-07-19.md.
//
// This is a drop-in replacement for the vendor singleton wired in
// open-next.config.ts -- same NAME/BINDING_NAME/PREFIX_ENV_NAME convention,
// `get`/`delete`/`getKVKey` copied verbatim from the vendor source (same
// public helpers it uses internally: `computeCacheKey`, `debugCache`,
// `getCloudflareContext`, all imported from the package's own public
// subpaths, not reimplemented -- this is NOT a fork). The only behavioral
// change is `set()` now passes `expirationTtl` on the underlying `kv.put()`.
//
// TTL values: Steve's guidance was "3-7x each cache type's own revalidate
// window" -- long enough that an entry never expires before Next's own
// revalidation would have refreshed it (which would silently raise the
// cold-MISS rate), short enough that a figure that stops getting traffic
// actually falls out of KV instead of living forever.
//   - page/route cache ("cache" -- `revalidate = 86400` = 24h in
//     src/app/figure/[figure_id]/page.tsx and [genre]/[line]/[slug]/page.tsx):
//     5 days.
//   - fetch/data cache ("fetch" -- `next: { revalidate: PRICE_FETCH_REVALIDATE_SECONDS }`
//     on the two R2 price fetches in FigureDetailContent.tsx): was 8 hours
//     against a 1h revalidate; raised to 3 days on 2026-09-02 (D2) when that
//     revalidate went 3600 -> 86400, keeping the "TTL > revalidate" invariant
//     at the low end of the 3-7x band. Storage delta is bounded: one small
//     JSON entry per figure that gets traffic, already the case at 8h.
// Cloudflare KV's `expirationTtl` minimum is 60 seconds; both values are far
// above it. See tests/kvIncrementalCacheTtl.test.mjs for the regression
// guard that fails loudly if a future edit ever drops the TTL again.
export const PAGE_CACHE_TTL_SECONDS = 5 * 24 * 60 * 60; // 5 days
export const FETCH_CACHE_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days

export function ttlSecondsForCacheType(cacheType: CacheEntryType | undefined): number {
  return cacheType === "fetch" ? FETCH_CACHE_TTL_SECONDS : PAGE_CACHE_TTL_SECONDS;
}

export const NAME = "cf-kv-incremental-cache-ttl";

export const BINDING_NAME = "NEXT_INC_CACHE_KV";

export const PREFIX_ENV_NAME = "NEXT_INC_CACHE_KV_PREFIX";

/**
 * TTL-enforcing variant of the vendor `KVIncrementalCache`. See the module
 * header comment above for why this exists and what changed.
 */
class KVIncrementalCacheWithTtl implements IncrementalCache {
  readonly name = NAME;

  async get<CacheType extends CacheEntryType = "cache">(
    key: string,
    cacheType?: CacheType
  ): Promise<WithLastModified<CacheValue<CacheType>> | null> {
    const kv = getCloudflareContext().env[BINDING_NAME];
    if (!kv) throw new IgnorableError("No KV Namespace");

    debugCache(NAME, `get ${key}`);

    try {
      const entry = await kv.get<IncrementalCacheEntry<CacheType>>(this.getKVKey(key, cacheType), "json");

      if (!entry) return null;

      if ("lastModified" in entry) {
        return entry;
      }

      // if there is no lastModified property, the file was stored during build-time cache population.
      // `__BUILD_TIMESTAMP_MS__` is a vendor-injected global (same one the
      // original KVIncrementalCache reads) with no ambient type declaration
      // in this project -- narrow via an inline cast rather than adding a
      // global augmentation for one field.
      return {
        value: entry,
        lastModified: (globalThis as unknown as { __BUILD_TIMESTAMP_MS__: number }).__BUILD_TIMESTAMP_MS__,
      };
    } catch (e) {
      error("Failed to get from cache", e);
      return null;
    }
  }

  async set<CacheType extends CacheEntryType = "cache">(
    key: string,
    value: CacheValue<CacheType>,
    cacheType?: CacheType
  ): Promise<void> {
    const kv = getCloudflareContext().env[BINDING_NAME];
    if (!kv) throw new IgnorableError("No KV Namespace");

    debugCache(NAME, `set ${key}`);

    try {
      await kv.put(
        this.getKVKey(key, cacheType),
        JSON.stringify({
          value,
          // Note: `Date.now()` returns the time of the last IO rather than the actual time.
          //       See https://developers.cloudflare.com/workers/reference/security-model/
          lastModified: Date.now(),
        }),
        { expirationTtl: ttlSecondsForCacheType(cacheType) }
      );
    } catch (e) {
      error("Failed to set to cache", e);
    }
  }

  async delete(key: string): Promise<void> {
    const kv = getCloudflareContext().env[BINDING_NAME];
    if (!kv) throw new IgnorableError("No KV Namespace");

    debugCache(NAME, `delete ${key}`);

    try {
      // Only cache that gets deleted is the ISR/SSG cache.
      await kv.delete(this.getKVKey(key, "cache" as CacheEntryType));
    } catch (e) {
      error("Failed to delete from cache", e);
    }
  }

  protected getKVKey(key: string, cacheType?: CacheEntryType): string {
    return computeCacheKey(key, {
      prefix: getCloudflareContext().env[PREFIX_ENV_NAME],
      buildId: process.env.NEXT_BUILD_ID,
      cacheType,
    });
  }
}

export default new KVIncrementalCacheWithTtl();
