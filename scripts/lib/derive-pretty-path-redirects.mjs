/**
 * derive-pretty-path-redirects.mjs -- pure derivation of the HARVESTED old-pretty-path ->
 * successor-fid map (2026-09-18).
 *
 * WHY: crawlers keep requesting pretty URLs that used to be served and now 404 (Cloudflare,
 * 7 d to 2026-09-17: 117 distinct dead figure paths from Bingbot/Googlebot/Applebot). The
 * hand ledger (src/data/pretty-path-redirects.ts) holds five. Its standard of proof is kept:
 * an entry exists only if the path was VERIFIABLY served -- a KB record at a named git commit
 * had exactly that fandom / line / character_canonical -- and the figure it pointed at is
 * still live, either as the same fid (a retag or slug cleanup) or through the duplicate_of
 * chain. No name similarity, no guessing: an unverifiable path stays a 404.
 *
 * WHY derived at build time instead of hand-listed: seo-preflight check 4 fetches every
 * hand-ledger entry on every deploy and STOPs the train if a target fid has left the KB. With
 * five curated entries that is a fair guard; with a harvested list it would let any future
 * dedup block the 05:00Z deploy. Here the ledger stores only the historical FACT
 * (path -> the fid that served it) and this function re-resolves the successor against
 * tonight's KB: a dead successor simply drops out, a re-deduped one follows the chain.
 *
 * The router's match rule is mirrored exactly (src/app/[genre]/[line]/[slug]/_lib/
 * findFigureMatches.ts): fandom = getFandom(genre); line token equals product_line or
 * `${manufacturer}-${product_line}`; character_canonical equals the slug; all lowercased.
 *
 * Pure: no I/O. scripts/build-figure-redirects.mjs feeds it; tests feed it fixtures.
 */

// Mirror of SLUG_TO_FANDOM in src/data/kbTypes.ts -- parity is asserted by
// tests/derivePrettyPathRedirects.test.mjs so the two cannot drift silently.
export const GENRE_TO_FANDOM = { 'teenage-mutant-ninja-turtles': 'tmnt', gijoe: 'gi-joe', marvel: 'marvel-comics' }

const norm = (s) => String(s ?? '').toLowerCase().trim()

export function parsePrettyPath(path) {
  const seg = String(path).split('/').filter(Boolean)
  if (seg.length !== 3) return null
  const [genre, line, slug] = seg.map(norm)
  if (genre === 'figure' || genre === 'guides' || line === 'character') return null
  return { genre, line, slug, fandom: GENRE_TO_FANDOM[genre] ?? genre }
}

/** True when `record` would be served at the parsed path by the router today. */
export function recordServesPath(record, parsed) {
  if (!record || record.phantom || record.duplicate_of) return false
  if (norm(record.fandom) !== parsed.fandom) return false
  if (norm(record.character_canonical) !== parsed.slug) return false
  const pl = norm(record.product_line)
  return pl === parsed.line || `${norm(record.manufacturer)}-${pl}` === parsed.line
}

/** Index of every path the current catalog serves, as `${fandom}|${line}|${slug}` keys (both line spellings). */
export function servedPathKeys(records) {
  const keys = new Set()
  for (const r of records) {
    if (!r || r.phantom || r.duplicate_of) continue
    const base = norm(r.fandom) + '|'
    const tail = '|' + norm(r.character_canonical)
    const pl = norm(r.product_line)
    keys.add(base + pl + tail)
    keys.add(base + norm(r.manufacturer) + '-' + pl + tail)
  }
  return keys
}

export function derivePrettyPathRedirects(ledger, records, fidRedirects, { maxHops = 5 } = {}) {
  const live = new Set()
  for (const r of records) if (r && !r.phantom && !r.duplicate_of) live.add(r.figure_id)
  const served = servedPathKeys(records)
  const stats = { candidates: 0, emitted: 0, sourceLive: 0, noSurvivor: 0, malformed: 0, viaChain: 0 }
  const map = {}
  for (const [path, fact] of Object.entries(ledger || {})) {
    stats.candidates++
    const parsed = parsePrettyPath(path)
    if (!parsed || !fact || typeof fact.fid !== 'string') { stats.malformed++; continue }
    // The path resolves on its own again (a record was re-added, or D1 was merely stale when
    // the 404 was logged): a live source never consults the map, so never emit it.
    if (served.has(`${parsed.fandom}|${parsed.line}|${parsed.slug}`)) { stats.sourceLive++; continue }
    let target = fact.fid
    let hops = 0
    const seen = new Set()
    while (!live.has(target) && fidRedirects[target] && !seen.has(target) && hops < maxHops) {
      seen.add(target)
      target = fidRedirects[target]
      hops++
    }
    if (!live.has(target)) { stats.noSurvivor++; continue }
    if (hops > 0) stats.viaChain++
    map[path] = target
    stats.emitted++
  }
  return { map: Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]])), stats }
}
