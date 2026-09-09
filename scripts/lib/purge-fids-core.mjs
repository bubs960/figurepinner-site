/**
 * purge-fids-core.mjs — pure helpers for purge-fids.mjs's ISR sweep
 * (pre-mortem item 2, 2026-09-09), split out so they're testable without
 * shelling out to wrangler (same reasoning grandfather-freshness.mjs
 * documents for its own split).
 */

export const BUILD_ID_PATTERN = /^[A-Za-z0-9_-]+$/
export const ISR_PREFIX = 'isr-cache/'

/** `isr-cache/<buildId>/` -- throws on a build id that doesn't match the
 *  expected shape, so an unexpected `.next/BUILD_ID` content can never flow
 *  into a shell command unvalidated (same guard kv-purge-stale-isr.mjs
 *  applies to build ids read from KV key names). */
export function isrPrefixForBuild(buildId) {
  if (typeof buildId !== 'string' || !BUILD_ID_PATTERN.test(buildId)) {
    throw new Error(`build id ${JSON.stringify(buildId)} doesn't match ${BUILD_ID_PATTERN} -- refusing to use it in a shell command.`)
  }
  return `${ISR_PREFIX}${buildId}/`
}

/** Defense in depth (same as kv-purge-stale-isr.mjs's assertAllPrefixed):
 *  don't trust wrangler/CF's server-side --prefix filter blindly -- if it
 *  ever returned a key outside the given prefix (e.g. a live `pro:`
 *  user-data key leaking into an isr-cache/ listing), that key must never
 *  reach the delete path silently. */
export function assertAllPrefixed(names, prefix, context) {
  const outOfPrefix = names.filter((n) => !n.startsWith(prefix))
  if (outOfPrefix.length) {
    throw new Error(`${context} got ${outOfPrefix.length} key(s) NOT starting with "${prefix}" (e.g. "${outOfPrefix[0]}") despite the --prefix filter -- refusing to proceed.`)
  }
}

/** Any valid-but-non-array JSON is a signal wrangler's output shape changed
 *  -- treating it as "found zero keys" would silently skip a real purge, so
 *  this throws instead of degrading quietly (same rule as the sibling
 *  script's parseKeyNames). */
export function parseKvKeyNames(out, context) {
  const parsed = JSON.parse(out)
  if (!Array.isArray(parsed)) {
    throw new Error(`${context} got non-array JSON from wrangler (typeof ${typeof parsed}) -- refusing to treat this as "zero keys".`)
  }
  return parsed.map((k) => k.name)
}

/** Split a key list into <= chunkSize pieces for a bulk-delete call. */
export function chunk(items, chunkSize) {
  const out = []
  for (let i = 0; i < items.length; i += chunkSize) out.push(items.slice(i, i + chunkSize))
  return out
}
