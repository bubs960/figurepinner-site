/**
 * derive-figure-redirects.mjs -- pure derivation of the generated old-fid -> survivor-fid
 * redirect map from the KB's own `duplicate_of` field (Release P, 2026-09-06).
 *
 * WHY: matcher's 9/2 Ruling A dedup marked ~1,000 records `duplicate_of` a survivor and
 * dropped them from the slim/servable catalog. The hand map (figure-id-redirects.ts) only
 * learns about merges through a relayed mapping table, and that batch was framed as
 * "phantom removal", so 904 formerly indexed /figure/<fid> URLs 404'd for four days
 * (WEB-TO-MATCHER-WEBAUDIT-904-DEDUPED-FIGURE-URLS-404-INSTEAD-OF-REDIRECT-FINDING-2026-09-06).
 * Deriving the map from the field makes every future dedup redirect automatically.
 *
 * RULES (they mirror tests/figureIdRedirects.test.mjs so the merged map always passes it):
 *  - a source is emitted only if it is NOT servable: a live source never consults the map,
 *    and emitting it would trip the "source still live" guard;
 *  - the target must be servable; chains (dup -> dup -> survivor) are followed up to maxHops;
 *  - self-references, cycles and unresolvable chains are dropped, never emitted;
 *  - a record removed with NO survivor (no duplicate_of) is not touched: it 404s, by design.
 *
 * Pure: no I/O, no KB import. scripts/build-figure-redirects.mjs feeds it the catalogs;
 * tests/deriveFigureRedirects.test.mjs feeds it fixtures.
 */
export function deriveFigureRedirects(records, servableIds, { maxHops = 5 } = {}) {
  const dupOf = new Map()
  for (const r of records) {
    const src = r && r.figure_id
    const tgt = r && r.duplicate_of
    if (typeof src === 'string' && typeof tgt === 'string' && tgt) dupOf.set(src, tgt)
  }
  const stats = { candidates: dupOf.size, emitted: 0, sourceStillServable: 0, targetMissing: 0, selfOrCycle: 0, chainsResolved: 0 }
  const map = {}
  for (const [src, first] of dupOf) {
    if (servableIds.has(src)) { stats.sourceStillServable++; continue }
    let tgt = first
    let hops = 0
    const seen = new Set([src])
    while (!servableIds.has(tgt)) {
      if (seen.has(tgt) || !dupOf.has(tgt) || hops >= maxHops) break
      seen.add(tgt)
      tgt = dupOf.get(tgt)
      hops++
    }
    if (!servableIds.has(tgt)) {
      if (tgt === src || seen.has(tgt)) stats.selfOrCycle++
      else stats.targetMissing++
      continue
    }
    if (hops > 0) stats.chainsResolved++
    map[src] = tgt
    stats.emitted++
  }
  const sorted = Object.fromEntries(Object.keys(map).sort().map(k => [k, map[k]]))
  return { map: sorted, stats }
}
