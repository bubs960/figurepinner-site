/**
 * figure-id-redirects.ts — explicit old-fid → new-fid map for KB rekeys/merges.
 *
 * The stable-suffix fallback in kb.ts cannot cover these: a merge or rekey
 * changes the trailing hash, so the old suffix matches nothing. Every entry
 * here was a live, indexable URL whose record was deliberately merged into or
 * rekeyed to a survivor — matcher relays each batch with a mapping table
 * (standing rule, 2026-07-31). Targets are fids, resolved against the live KB
 * at request time; a target missing from the KB falls through to 404 rather
 * than redirecting to a dead page.
 *
 * Deliberately NOT here: fids removed with no survivor (phantom records) —
 * those 404 correctly.
 */
export const FIGURE_ID_REDIRECTS: Record<string, string> = {
  // 7/22 WWE true-duplicate sweep, deployed in 470b230 (7/23 nightly) —
  // MATCHER-TO-WEB-470b230-3-FIGURES-ANSWERED-REDIRECT-MAP-2026-07-31.md
  'fp_wrestling_jakks-pacific_jakk-d-up_none_sable_b0b53f':
    'fp_wrestling_jakks-pacific_jakkd-up_none_sable_c5a18f',
  'fp_wrestling_jakks-pacific_mailaway-exclusive_none_debra-mcmichael_800b94':
    'fp_wrestling_jakks-pacific_mailaways_none_debra-mcmichael_c82727',
  'fp_wrestling_jakks-pacific_tna-legends-of-the-ring_ex_terry-taylor_c31cce':
    'fp_wrestling_jakks-pacific_tna-deluxe-impact_6_terry-taylor_c16439',

  // 7/30 Defining Moments audit canonical rekey —
  // MATCHER-DM-AUDIT-COMPLETE-2026-07-30.md
  'fp_wrestling_mattel_defining-moments_6_steve-austin_626ed8':
    'fp_wrestling_mattel_defining-moments_6_stone-cold-steve-a_3a88fa',
}
