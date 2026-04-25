/**
 * Pro status helpers.
 * Pro flag is stored in Clerk publicMetadata.isPro (set by Stripe webhook).
 *
 * Lookup paths:
 *   1. KV cache (PRO_KV) keyed by `pro:<userId>` with 5-min TTL.
 *   2. Browser session (currentUser()) — already has the user object loaded
 *      from the Clerk middleware, no API hop. Result still cached for the
 *      Bearer JWT path that may follow.
 *   3. Bearer JWT (mobile) — currentUser() returns null, so we fall back to
 *      clerkClient().users.getUser(userId). This is the EXPENSIVE path —
 *      it's a server-to-server HTTP call to Clerk's backend on every authed
 *      write. The KV cache primarily exists to short-circuit this path.
 *
 * Cache TTL = 300 seconds (5 min). When a user upgrades via Stripe webhook,
 * their Pro status takes up to 5 min to propagate. If we want sub-minute
 * upgrade UX later, the webhook can call `invalidateProCache(userId)`
 * explicitly to flush the entry.
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const PRO_CACHE_TTL_SECONDS = 300 // 5 min
const PRO_CACHE_PREFIX = 'pro:'

interface CachedProEntry {
  isPro: boolean
  cachedAt: number
}

// Minimal structural type for the KV binding — avoids depending on the global
// KVNamespace type (which Next.js/TS doesn't always pick up across the build).
// The real CF KVNamespace satisfies this shape.
interface KVLike {
  get(key: string, type?: 'json' | 'text' | 'arrayBuffer' | 'stream'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

async function getProKV(): Promise<KVLike | null> {
  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((env as any).PRO_KV as KVLike | undefined) ?? null
  } catch {
    return null
  }
}

async function readCache(userId: string): Promise<boolean | null> {
  const kv = await getProKV()
  if (!kv) return null
  try {
    const raw = await kv.get(PRO_CACHE_PREFIX + userId, 'json')
    if (raw && typeof (raw as CachedProEntry).isPro === 'boolean') {
      return (raw as CachedProEntry).isPro
    }
    return null
  } catch {
    return null
  }
}

async function writeCache(userId: string, isPro: boolean): Promise<void> {
  const kv = await getProKV()
  if (!kv) return
  try {
    const entry: CachedProEntry = { isPro, cachedAt: Date.now() }
    await kv.put(PRO_CACHE_PREFIX + userId, JSON.stringify(entry), {
      expirationTtl: PRO_CACHE_TTL_SECONDS,
    })
  } catch {
    // KV write failures are silent — we'd rather have a slow hot path than
    // a broken request.
  }
}

/**
 * Explicitly invalidate the cached Pro status for a user. Call this from the
 * Stripe webhook after `checkout.session.completed` so upgrades go live
 * immediately instead of waiting for the 5-min TTL to expire.
 */
export async function invalidateProCache(userId: string): Promise<void> {
  const kv = await getProKV()
  if (!kv) return
  try {
    await kv.delete(PRO_CACHE_PREFIX + userId)
  } catch {
    // best-effort
  }
}

/**
 * Returns true if the currently authenticated user has Pro.
 * Works with both Clerk session cookies (web) and Bearer JWT (mobile).
 * Call this inside API routes only (server-side).
 */
export async function isUserPro(): Promise<boolean> {
  // Resolve userId first — needed for cache key in either auth path.
  const { userId } = await auth()
  if (!userId) return false

  // 1. Cache hit? Short-circuit before any Clerk call.
  const cached = await readCache(userId)
  if (cached !== null) return cached

  // 2. Session cookie path: currentUser() returns the user object directly,
  //    no API hop. Use it if available, then warm the cache for any Bearer
  //    JWT calls that may follow on this user.
  const user = await currentUser()
  if (user) {
    const isPro = user.publicMetadata?.isPro === true
    await writeCache(userId, isPro)
    return isPro
  }

  // 3. Bearer JWT path: server-to-server call to Clerk. Most expensive —
  //    KV cache primarily exists to skip this.
  try {
    const client = await clerkClient()
    const fullUser = await client.users.getUser(userId)
    const isPro = fullUser.publicMetadata?.isPro === true
    await writeCache(userId, isPro)
    return isPro
  } catch {
    // Fail closed (treat as free) on Clerk backend errors.
    return false
  }
}

/** Free-tier limits — single source of truth */
export const FREE_LIMITS = {
  VAULT: 25,
  ALERTS: 3,
  LIST_IT_MONTHLY: 5,
  SEARCHES_MONTHLY: 100,
} as const
