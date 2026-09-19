/**
 * inNextBuild — true only inside `next build`'s static-generation workers
 * (plain Node processes). Use it to skip `getCloudflareContext({ async: true })`.
 *
 * WHY (trains #9 9/12 and #15 9/19, both dead at "Generating static pages"
 * with build-worker exit 3221226505 right after `std::terminate` from workerd):
 * in a Node process the async form finds no context, so OpenNext starts a
 * LOCAL workerd through wrangler's getPlatformProxy
 * (node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js,
 * getCloudflareContextAsync). Nothing is memoised until one start succeeds, so
 * concurrent first calls, and every call after a failed start, spawn another
 * one — several per build worker, on every build. The local bindings it would
 * hand back are empty simulations (no kb-lite asset, no price objects), so a
 * build gains nothing from them; every caller already has a non-binding path.
 *
 * Two independent conditions, so this can never be true in production:
 * NEXT_PHASE is set by `next build` and inherited only by its own workers, and
 * a real Worker (deployed, or `wrangler dev`) reports navigator.userAgent
 * 'Cloudflare-Workers'. No node: imports — this is reachable from a client
 * bundle through kbLite.ts.
 */
export function inNextBuild(): boolean {
  if (typeof process === 'undefined' || process.env.NEXT_PHASE !== 'phase-production-build') return false
  const ua = (globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent
  return ua !== 'Cloudflare-Workers'
}
