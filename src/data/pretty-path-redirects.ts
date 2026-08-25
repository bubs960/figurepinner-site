/**
 * pretty-path-redirects.ts — old [genre]/[line]/[slug] path → successor fid.
 *
 * WHY separate from figure-id-redirects.ts: that file maps old fid → new fid,
 * which works for the /figure/:id route because the id itself is the lookup
 * key. But a pretty path (/genre/line/slug) is DERIVED from a record's
 * fandom/product_line/character_canonical at the time it was live — a rekey,
 * merge, or fandom retag can change the pretty path even when the fid is
 * unchanged (a retag), or change the fid too (a rekey/merge), and once the
 * old record is gone from the KB there is nothing left to derive its old
 * pretty path FROM. This map keys on the exact old served path instead, so
 * the lookup doesn't depend on reconstructing anything at request time.
 *
 * WHY this exists at all (2026-08-24, replaces a blanket
 * permanentRedirect('/${genre}') fallback that fired for ANY unmatched
 * line/slug under a valid genre — typos, delisted figures, garbage input,
 * not just real renames): Google's own soft-404 guidance treats "broken URL
 * redirects to an unrelated hub/category page" as a soft 404 regardless of
 * intent, which is exactly what the blanket fallback was doing for every
 * non-alias miss. A 308 is a strong "this exact resource permanently moved
 * here" signal — issuing it for garbage input, with the genre hub as an
 * always-available catch-all destination, teaches Google (and users) that
 * literally any URL under a valid genre "resolves" to something, which is
 * false. See WEB-TO-WEBAUDIT-PHASE1-VERIFIED-AND-BUILT-2026-08-24.md and
 * the external-audit decision thread it's answered by.
 *
 * Every entry here must be a VERIFIED former URL: it was genuinely served/
 * indexable at some point, and the figure it pointed at was later merged,
 * rekeyed, or retagged into a survivor still live in the KB today — never a
 * guess, a fuzzy match, or "these two names look similar." Reconstructed
 * from git history (the old record's fields at the commit just before
 * removal) cross-referenced against matcher's rekey/merge relays.
 *
 * Deliberately NOT here: paths for figures removed with no survivor
 * (phantom records, true duplicates with no consolidation target) — those
 * 404 correctly, same policy as FIGURE_ID_REDIRECTS.
 *
 * Validated on every deploy by scripts/validate-pretty-path-redirects.mjs —
 * see that script for the exact checks (target exists, target is live and
 * self-canonical, single hop, no cycles, source isn't a currently-valid
 * figure URL).
 *
 * This is a first pass, not a complete historical harvest — new entries
 * should be added as more renamed/rekeyed/retagged figures are identified
 * (matcher's rekey pipeline is the durable long-term source; see the ask in
 * the source doc above). An incomplete ledger just means more unmatched
 * legacy URLs 404 instead of redirecting, which is the correct, safe
 * default per the same soft-404 reasoning — never add a speculative entry
 * to shrink the "missing" list.
 */
export const PRETTY_PATH_REDIRECTS: Record<string, string> = {
  // First reconstruction pass, 2026-08-24 — each entry independently verified
  // against the historical KB snapshot at the commit just before the old fid
  // was removed (old fandom/product_line/character_canonical read directly
  // from that commit's data, not inferred from the fid string). Two other
  // documented rekeys from the same pass (cody-rhodes wrestlemania-40,
  // stardust wrestlemania-31) are deliberately NOT here: both collided with
  // a sibling wave at the old snapshot, so no pretty path ever existed for
  // them — their old canonical was always /figure/:id, already covered by
  // figure-id-redirects.ts.

  // 7/22 WWE true-duplicate sweep -- MATCHER-TO-WEB-470b230-3-FIGURES-ANSWERED-REDIRECT-MAP-2026-07-31.md
  '/wrestling/jakk-d-up/sable':
    'fp_wrestling_jakks-pacific_jakkd-up_none_sable_c5a18f',
  '/wrestling/mailaway-exclusive/debra-mcmichael':
    'fp_wrestling_jakks-pacific_mailaways_none_debra-mcmichael_c82727',
  '/wrestling/tna-legends-of-the-ring/terry-taylor':
    'fp_wrestling_jakks-pacific_tna-deluxe-impact_6_terry-taylor_c16439',

  // 7/30 Defining Moments audit canonical rekey -- MATCHER-DM-AUDIT-COMPLETE-2026-07-30.md
  '/wrestling/defining-moments/steve-austin':
    'fp_wrestling_mattel_defining-moments_6_stone-cold-steve-a_3a88fa',

  // 8/23 WM-miscatalog cleanup -- MATCHER-TO-WEB-WM-MISCATALOG-REDIRECT-PAIRS-2026-08-23.md
  '/wrestling/wrestlemania/becky-lynch':
    'fp_wrestling_mattel_elite_112_becky-lynch_3d7e12',
}
