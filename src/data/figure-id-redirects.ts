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

  // 8/23 WM golden-corpus miscatalog cleanup — 3 phantom wrestlemania-line
  // duplicates of existing elite-line records, removed from KB —
  // MATCHER-TO-WEB-WM-MISCATALOG-REDIRECT-PAIRS-2026-08-23.md
  'fp_wrestling_mattel_wrestlemania_40_becky-lynch_537e6e':
    'fp_wrestling_mattel_elite_112_becky-lynch_3d7e12',
  'fp_wrestling_mattel_wrestlemania_40_cody-rhodes_5fe261':
    'fp_wrestling_mattel_elite_111_cody-rhodes_133ae0',
  'fp_wrestling_mattel_wrestlemania_31_stardust_3cf429':
    'fp_wrestling_mattel_elite_36_stardust_b73853',

  // 8/27 Rey Mysterio S&S conflation split (FIGURE-ISSUE-QUEUE Batch 20) — the
  // old fid merged two real products and was rekeyed to the 2006 boxed LE it
  // actually depicted; the 2005 carded ToyFare S&S Rey got its own NEW fid
  // (918bab), which needs no redirect. No pretty-path entry either: 3 boxed-LE
  // rey-mysterio records existed at the pre-removal snapshot, so the old
  // canonical was always /figure/:id (same reasoning as the cody-rhodes/
  // stardust exclusions in pretty-path-redirects.ts) —
  // MATCHER-TO-WEB-REY-SAS-REKEY-REDIRECT-PAIR-2026-08-27.md
  'fp_wrestling_jakks-pacific_boxed-limited-edition_stars-and-stripes-internet-exclusive_rey-mysterio_0ecb88':
    'fp_wrestling_jakks-pacific_boxed-limited-edition_none_rey-mysterio_b69595',

  // ⚠️ PARKED 8/28 (commented pairs below): matcher's phantom-drop for these
  // sources has NOT reached the site KB sync yet — all 21 commented sources
  // are still live records here, and the structural guard test correctly
  // refuses a redirect whose source a live record shadows. UNCOMMENT each
  // batch when the sync that drops them lands (next KB drift commit should
  // carry it; re-run npm test to confirm). The 2 active pairs below are the
  // Batch 22/24/25 surgeries whose old fids are already gone.
  // 8/27 re-key/dedup pour, FIGURE-ISSUE-QUEUE Batches 22/24/25 (15 pairs) —
  // MATCHER-TO-WEB-REKEY-REDIRECT-PAIRS-B22-24-25-2026-08-27.md. The 6
  // never-released/prototype phantoms from the same relay have no survivor
  // and correctly 404 (standing policy above).
  // 'fp_wrestling_mattel_elite_1_fatu_d29d90':
  // 'fp_wrestling_mattel_elite-legends_18_fatu_c93a8a',
  // 'fp_wrestling_mattel_elite_2_1-2-3-kid_ba76ec':
  // 'fp_wrestling_mattel_elite_41_1-2-3-kid_4cbbb5',
  // 'fp_wrestling_mattel_elite_3_colonel-mustafa_5d29d6':
  // 'fp_wrestling_mattel_elite_86_colonel-mustafa_21826b46bbc7',
  // 'fp_wrestling_mattel_elite_1_hbk_519319':
  // 'fp_wrestling_mattel_elite_3_shawn-michaels_306022',
  // 'fp_wrestling_mattel_elite_3_queen-sherri_6ce4ea':
  // 'fp_wrestling_mattel_elite_65_sensational-sherri_19068864364b',
  // 'fp_wrestling_mattel_elite_2_avalanche_d3261d':
  // 'fp_wrestling_mattel_elite_35_earthquake_3cf156',
  // 'fp_wrestling_mattel_elite_2_adam-copeland_3836ea':
  // 'fp_wrestling_jazwares_aew-unmatched_10_adam-copeland_64e689',
  // 'fp_other_neca_neca-movies_movies_goliath_9642c1':
  // 'fp_tv_neca_ultimate_2021_goliath_44939d',
  // 'fp_other_neca_neca-movies_movies_demona_545a9b':
  // 'fp_tv_neca_ultimate_2022_demona_208178',
  // 'fp_other_neca_neca-movies_movies_brooklyn_44ddd6':
  // 'fp_tv_neca_ultimate_2023_brooklyn_dade2d',
  // 'fp_other_neca_neca-movies_movies_lexington_985685':
  // 'fp_tv_neca_ultimate_2023_lexington_f59269',
  // 'fp_other_neca_neca-movies_movies_broadway_95b87e':
  // 'fp_tv_neca_ultimate_2022_broadway_b209fb',
  // 'fp_other_neca_neca-movies_movies_bronx_78c611':
  // 'fp_tv_neca_ultimate_2022_bronx_e94443',
  'fp_wrestling_mattel_elite_1_manik_173ec9':
    'fp_wrestling_mattel_elite-network-spotlight_1_tj-perkins_358ff9',
  'fp_wrestling_toy-biz_wcw-toy-biz_bgt_sting-vs-sid-vic_d39ecc':
    'fp_wrestling_toy-biz_wcw-toy-biz_bgt_giant-vs-kevin-n_227e28',

  // 8/27 star-wars credit-collection pilot pour (2 dup phantom-flags) —
  // MATCHER-TO-WEB-CREDIT-COLLECTION-SW-PILOT-POURED-2026-08-27.md
  // 'fp_star-wars_hasbro_credit-collection_credit-collection_the-mandalorian_5366a6':
  // 'fp_star-wars_hasbro_credit-collection_credit-collection_mandalorian_7c7538',
  // 'fp_star-wars_hasbro_credit-collection_credit-collection_the-armorer_c1b8b0':
  // 'fp_star-wars_hasbro_credit-collection_credit-collection_armorer_f8a146',

  // 8/27 Codex queue E pour (6 dup phantom-flags with duplicate_of) —
  // MATCHER-TO-WEB-CODEX-E-REDIRECT-PAIRS-2026-08-27.md
  // 'fp_wrestling_mattel_wwe-superstars_3_million-dollar-m_fed384':
  // 'fp_wrestling_jakks-pacific_classic-superstars_3_ted-dibiase_fc14d8',
  // 'fp_wrestling_mattel_wwe-superstars_3_undertaker_596e6c':
  // 'fp_wrestling_jakks-pacific_classic-superstars_3_undertaker_617a7b',
  // 'fp_wrestling_mattel_wwe-superstars_8_hulk-hogan_3c3066':
  // 'fp_wrestling_jakks-pacific_classic-superstars_8_hollywood-hulk-hogan_ee511d',
  // 'fp_wrestling_jakks-pacific_deluxe-aggression_17_david-hart-smith_11f655':
  // 'fp_wrestling_jakks-pacific_deluxe-aggression_17_dh-smith_cb7235',
  // 'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_a-wing_8dfdc3':
  // 'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_a-wing_bbc0de',
  // 'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_ezra-bridgers-a-wing_13e1b6':
  // 'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_ezra-bridger-s-a-wing_04ed82',
}
