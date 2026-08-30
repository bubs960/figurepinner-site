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

  // 8/28 UNPARKED: matcher's phantom-drop sync landed (emit-site-slim-kb.py
  // fix, slim re-emitted at 23,241 fids) — all 21 previously-parked sources
  // are gone from the site KB; guard test confirms mechanically.
  // MATCHER-TO-WEB-PHANTOM-DROP-FIXED-SLIM-RESYNCED-2026-08-28.md
  // 8/27 re-key/dedup pour, FIGURE-ISSUE-QUEUE Batches 22/24/25 (15 pairs) —
  // MATCHER-TO-WEB-REKEY-REDIRECT-PAIRS-B22-24-25-2026-08-27.md. The 6
  // never-released/prototype phantoms from the same relay have no survivor
  // and correctly 404 (standing policy above).
  'fp_wrestling_mattel_elite_1_fatu_d29d90':
    'fp_wrestling_mattel_elite-legends_18_fatu_c93a8a',
  'fp_wrestling_mattel_elite_2_1-2-3-kid_ba76ec':
    'fp_wrestling_mattel_elite_41_1-2-3-kid_4cbbb5',
  'fp_wrestling_mattel_elite_3_colonel-mustafa_5d29d6':
    'fp_wrestling_mattel_elite_86_colonel-mustafa_21826b46bbc7',
  'fp_wrestling_mattel_elite_1_hbk_519319':
    'fp_wrestling_mattel_elite_3_shawn-michaels_306022',
  'fp_wrestling_mattel_elite_3_queen-sherri_6ce4ea':
    'fp_wrestling_mattel_elite_65_sensational-sherri_19068864364b',
  'fp_wrestling_mattel_elite_2_avalanche_d3261d':
    'fp_wrestling_mattel_elite_35_earthquake_3cf156',
  'fp_wrestling_mattel_elite_2_adam-copeland_3836ea':
    'fp_wrestling_jazwares_aew-unmatched_10_adam-copeland_64e689',
  'fp_other_neca_neca-movies_movies_goliath_9642c1':
    'fp_tv_neca_ultimate_2021_goliath_44939d',
  'fp_other_neca_neca-movies_movies_demona_545a9b':
    'fp_tv_neca_ultimate_2022_demona_208178',
  'fp_other_neca_neca-movies_movies_brooklyn_44ddd6':
    'fp_tv_neca_ultimate_2023_brooklyn_dade2d',
  'fp_other_neca_neca-movies_movies_lexington_985685':
    'fp_tv_neca_ultimate_2023_lexington_f59269',
  'fp_other_neca_neca-movies_movies_broadway_95b87e':
    'fp_tv_neca_ultimate_2022_broadway_b209fb',
  'fp_other_neca_neca-movies_movies_bronx_78c611':
    'fp_tv_neca_ultimate_2022_bronx_e94443',
  'fp_wrestling_mattel_elite_1_manik_173ec9':
    'fp_wrestling_mattel_elite-network-spotlight_1_tj-perkins_358ff9',
  'fp_wrestling_toy-biz_wcw-toy-biz_bgt_sting-vs-sid-vic_d39ecc':
    'fp_wrestling_toy-biz_wcw-toy-biz_bgt_giant-vs-kevin-n_227e28',

  // 8/27 star-wars credit-collection pilot pour (2 dup phantom-flags) —
  // MATCHER-TO-WEB-CREDIT-COLLECTION-SW-PILOT-POURED-2026-08-27.md
  'fp_star-wars_hasbro_credit-collection_credit-collection_the-mandalorian_5366a6':
    'fp_star-wars_hasbro_credit-collection_credit-collection_mandalorian_7c7538',
  'fp_star-wars_hasbro_credit-collection_credit-collection_the-armorer_c1b8b0':
    'fp_star-wars_hasbro_credit-collection_credit-collection_armorer_f8a146',

  // 8/27 Codex queue E pour (6 dup phantom-flags with duplicate_of) —
  // MATCHER-TO-WEB-CODEX-E-REDIRECT-PAIRS-2026-08-27.md
  'fp_wrestling_mattel_wwe-superstars_3_million-dollar-m_fed384':
    'fp_wrestling_jakks-pacific_classic-superstars_3_ted-dibiase_fc14d8',
  'fp_wrestling_mattel_wwe-superstars_3_undertaker_596e6c':
    'fp_wrestling_jakks-pacific_classic-superstars_3_undertaker_617a7b',
  'fp_wrestling_mattel_wwe-superstars_8_hulk-hogan_3c3066':
    'fp_wrestling_jakks-pacific_classic-superstars_8_hollywood-hulk-hogan_ee511d',
  'fp_wrestling_jakks-pacific_deluxe-aggression_17_david-hart-smith_11f655':
    'fp_wrestling_jakks-pacific_deluxe-aggression_17_dh-smith_cb7235',
  'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_a-wing_8dfdc3':
    'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_a-wing_bbc0de',
  'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_ezra-bridgers-a-wing_13e1b6':
    'fp_star-wars_hasbro_micro-galaxy-squadron_light-armor-class_ezra-bridger-s-a-wing_04ed82',

  // 8/28 held-surgeries pour (3 re-keys; deluxe-aggression_25_mark-henry is a
  // phantom with no survivor and correctly 404s) —
  // MATCHER-TO-WEB-HELD-SURGERIES-POURED-3-REDIRECT-PAIRS-2026-08-28.md
  'fp_wrestling_mattel_summerslam_86_triple-h_87503f':
    'fp_wrestling_jakks-pacific_ruthless-aggression-ppv_2_hhh_040bb5',
  'fp_wrestling_mattel_summerslam_ss_goldberg_ded67a':
    'fp_wrestling_jakks-pacific_ruthless-aggression-ppv_2_goldberg_1b8d0a',
  'fp_wrestling_mattel_wwe-superstars_10_big-boss-man_1e84c8':
    'fp_wrestling_grand-toys_wrestling-superstars_6_big-boss-man_12f029',

  // 8/28 Codex queue F re-keys (2 pairs; elite_3_2026-new-york-toy-fair stays
  // held/UNKNOWN, no redirect) —
  // MATCHER-TO-WEB-QUEUE-F-REKEYS-2-REDIRECT-PAIRS-2026-08-28.md
  'fp_wrestling_mattel_elite_1_2026-wwe-world_726dcb':
    'fp_wrestling_mattel_elite-walmart-exclusive_none_the-rock_33bc7d',
  'fp_wrestling_mattel_elite_2_2026-wwe-world_1a1456':
    'fp_wrestling_mattel_elite-hall-of-fame_none_shawn-michaels_8a82e3',

  // 8/28 Galaxy's Edge Black Series dedup (Codex queue G): the misspelled
  // `galaxy-s-edge` bucket phantomed with duplicate_of; survivors keep the
  // canonical `galaxys-edge` wave key —
  // MATCHER-TO-WEB-GALAXYS-EDGE-DEDUP-POURED-2026-08-28.md
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_galaxy-edge-first-order_c316ef':
    'fp_star-wars_hasbro_black-series_galaxys-edge_galaxy-edge-first-order_b19888',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_galaxy-edge-first-order_7abb49':
    'fp_star-wars_hasbro_black-series_galaxys-edge_galaxy-edge-first-order_eee1f0',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_galaxy-edge-droid-depot_c38615':
    'fp_star-wars_hasbro_black-series_galaxys-edge_galaxy-edge-droid-depot_766791',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_galaxy-edge-droid-depot_d79a2a':
    'fp_star-wars_hasbro_black-series_galaxys-edge_galaxy-edge-droid-depot_af049f',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_galaxy-edge-smugglers-run_0ca570':
    'fp_star-wars_hasbro_black-series_galaxys-edge_galaxy-edge-smugglers-run_ed984c',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_galaxy-edge-galactic-creatures_3efc7a':
    'fp_star-wars_hasbro_black-series_galaxys-edge_galaxy-edge-galactic-creatures_208d9e',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_captain-cardinal_1334a7':
    'fp_star-wars_hasbro_black-series_galaxys-edge_captain-cardinal_a5a328',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_commander-pyre_f22aba':
    'fp_star-wars_hasbro_black-series_galaxys-edge_commander-pyre_5a4f19',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_dj-r-3x_25279c':
    'fp_star-wars_hasbro_black-series_galaxys-edge_dj-r-3x_e26a34',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_hondo-ohnaka_206560':
    'fp_star-wars_hasbro_black-series_galaxys-edge_hondo-ohnaka_bef7f6',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_mountain-trooper_cbc198':
    'fp_star-wars_hasbro_black-series_galaxys-edge_mountain-trooper_3fbc7f',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_r5-p8_352f74':
    'fp_star-wars_hasbro_black-series_galaxys-edge_r5-p8_af744b',
  'fp_star-wars_hasbro_black-series_galaxy-s-edge_dok-ondar_e102b2':
    'fp_star-wars_hasbro_black-series_galaxys-edge_dok-ondar_3f130b',

  // 8/29 BS-exclusives dedup (Codex verification pour): 5 duplicate-of pairs.
  // rancor_8fc794 + both Reva FX rows are no-product phantoms (HasLab Rancor
  // never funded; Reva FX is a replica, not a figure) — correct 404s, no pair —
  // MATCHER-TO-WEB-BS-EXCLUSIVES-MAPPING-TABLE-ANSWER-2026-08-29.md
  'fp_star-wars_hasbro_black-series_exclusives_luke-skywalker-jedi-master-on-ahch-to-island_106bcc':
    'fp_star-wars_hasbro_black-series_exclusives_luke-skywalker-on-ahch-to-island_54dbaf',
  'fp_star-wars_hasbro_black-series_exclusives_arc-trooper-infiltrator-commando-droid_5b97f6':
    'fp_star-wars_hasbro_black-series_exclusives_arc-trooper-commando-droid_7bbbb9',
  'fp_star-wars_hasbro_black-series_exclusives_darth-vader-emperors-wrath_687273':
    'fp_star-wars_hasbro_black-series_exclusives_darth-vader-emperor-s-wrath_47002c',
  'fp_star-wars_hasbro_black-series_exclusives_mandalorian_7c8ae2':
    'fp_star-wars_hasbro_black-series_exclusives_the-mandalorian_ce6441',
  'fp_star-wars_hasbro_black-series_exclusives_ronin-r5-d56_6ed9c2':
    'fp_star-wars_hasbro_black-series_exclusives_the-ronin-r5-d56_cb2b77',

  // 8/29 galaxy-bucket slug-vs-prose dedup (13 pairs): bare-slug twin phantomed,
  // `the-` prose row survives —
  // MATCHER-TO-WEB-GALAXY-THE-DEDUP-POURED-13-REDIRECT-PAIRS-2026-08-29.md
  'fp_star-wars_hasbro_black-series_galaxy_armorer_b51b96':
    'fp_star-wars_hasbro_black-series_galaxy_the-armorer_eaa259',
  'fp_star-wars_hasbro_black-series_galaxy_armorer_5acd3a':
    'fp_star-wars_hasbro_black-series_galaxy_the-armorer_38ea13',
  'fp_star-wars_hasbro_black-series_galaxy_client_d1fdb8':
    'fp_star-wars_hasbro_black-series_galaxy_the-client_ec2821',
  'fp_star-wars_hasbro_black-series_galaxy_figrin-dan_aacf37':
    'fp_star-wars_hasbro_black-series_galaxy_figrin-d-an_40a5ff',
  'fp_star-wars_hasbro_black-series_galaxy_mandalorian-and-grogu_d09f78':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian-and-grogu_0109c5',
  'fp_star-wars_hasbro_black-series_galaxy_mandalorian_b0d576':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian_a8a4c4',
  'fp_star-wars_hasbro_black-series_galaxy_mandalorian-grogu_8aa4f3':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian-grogu_353286',
  'fp_star-wars_hasbro_black-series_galaxy_mandalorian-grogu_857ca0':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian-grogu_acd701',
  'fp_star-wars_hasbro_black-series_galaxy_mandalorian-grogu_28614a':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian-grogu_a97600',
  'fp_star-wars_hasbro_black-series_galaxy_mandalorian_2a85b7':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian_a6e2ba',
  'fp_star-wars_hasbro_black-series_galaxy_mandalorian_68f425':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian_2b4364',
  'fp_star-wars_hasbro_black-series_galaxy_ronin_ac0bac':
    'fp_star-wars_hasbro_black-series_galaxy_the-ronin_2434ee',
  'fp_star-wars_hasbro_black-series_galaxy_stranger_03abb0':
    'fp_star-wars_hasbro_black-series_galaxy_the-stranger_15bdd0',

  // 8/29 galaxy K-r1 metadata pour (6 dedup phantoms) —
  // MATCHER-TO-WEB-GALAXY-K-R1-POURED-6-REDIRECT-PAIRS-2026-08-29.md
  'fp_star-wars_hasbro_black-series_galaxy_captain-cassian-andor_d1692a':
    'fp_star-wars_hasbro_black-series_galaxy_cassian-andor_2820d7',
  'fp_star-wars_hasbro_black-series_galaxy_chopper-c1-10p-repack_a6bab1':
    'fp_star-wars_hasbro_black-series_galaxy_chopper-repack_4fea6b',
  'fp_star-wars_hasbro_black-series_galaxy_clone-commando-urban-fighter-b1-battle-droid_278c53':
    'fp_star-wars_hasbro_black-series_galaxy_clone-commando-b1-battle-droid_8d0668',
  'fp_star-wars_hasbro_black-series_galaxy_darth-vader_0c053b':
    'fp_star-wars_hasbro_black-series_galaxy_darth-vader_3f6b74',
  'fp_star-wars_hasbro_black-series_galaxy_garazeb-zeb-orrelios_9e1588':
    'fp_star-wars_hasbro_black-series_galaxy_garazeb-orrelios_5cd4a4',
  'fp_star-wars_hasbro_black-series_galaxy_hk-87-assassin-droid_69c2df':
    'fp_star-wars_hasbro_black-series_galaxy_hk-87_f54ee7',

  // 8/29 surgery batches 28/29/30 (10 pairs: elite dedups/re-key + BS force-awakens->galaxy re-keys) —
  // MATCHER-TO-WEB-SURGERY-B28-29-30-POURED-10-REDIRECT-PAIRS-2026-08-29.md
  'fp_wrestling_mattel_elite_3_miz_5d087e':
    'fp_wrestling_mattel_elite_3_the-miz_7770c5',
  'fp_wrestling_mattel_elite_5_triple-h_9cc72b':
    'fp_wrestling_mattel_elite_best-of-2010_triple-h_f91211',
  'fp_star-wars_hasbro_black-series_force-awakens-20_the-mandalorian_45536e':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian_8d6a1f',
  'fp_star-wars_hasbro_black-series_force-awakens-2015-2018_mandalorian_9709bd':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian_8d6a1f',
  'fp_star-wars_hasbro_black-series_force-awakens-20_the-mandalorian_f24716':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian-first-edition_543ecf',
  'fp_star-wars_hasbro_black-series_force-awakens-2015-2018_mandalorian_ba0d46':
    'fp_star-wars_hasbro_black-series_galaxy_the-mandalorian-first-edition_543ecf',
  'fp_star-wars_hasbro_black-series_force-awakens-2015-2018_cal-kestis_1e8397':
    'fp_star-wars_hasbro_black-series_galaxy_cal-kestis_3285bf',
  'fp_star-wars_hasbro_black-series_force-awakens-2015-2018_cal-kestis_b89329':
    'fp_star-wars_hasbro_black-series_galaxy_cal-kestis-first-edition_509a59',
  'fp_star-wars_hasbro_black-series_force-awakens-2015-2018_cara-dune_dfc14a':
    'fp_star-wars_hasbro_black-series_galaxy_cara-dune_526368',
  'fp_star-wars_hasbro_black-series_exclusives_x-34-landspeeder-and-luke-skywal_820f2f':
    'fp_star-wars_hasbro_black-series_exclusives_x-34-landspeeder-and-luke-skywalker_3fd5f0',

  // 8/29 elite wave-vs-subline miskey sweep (5 dedup + 22 mint) —
  // MATCHER-TO-WEB-ELITE-MISKEY-SWEEP-POURED-27-REDIRECT-PAIRS-2026-08-29.md
  'fp_wrestling_mattel_elite_29_rob-van-dam_a977d9':
    'fp_wrestling_mattel_elite-legends_29_rob-van-dam_a0c810',
  'fp_wrestling_mattel_elite_2_alundra-blayze_2f11cd':
    'fp_wrestling_mattel_elite-flashback_2_alundra-blayze_ba7158',
  'fp_wrestling_mattel_elite_3_miss-elizabeth_cce195':
    'fp_wrestling_mattel_elite-then-now-forever_3_miss-elizabeth_bdd066',
  'fp_wrestling_mattel_elite_1_eddie-guerrero_24a5ea':
    'fp_wrestling_mattel_elite-hall-of-champions_1_eddie-guerrero_57c566',
  'fp_wrestling_mattel_elite_2_ric-flair_2891bd':
    'fp_wrestling_mattel_elite-retrofest_2_ric-flair_87730e',
  'fp_wrestling_mattel_elite_1_bam-bam-bigelow_a69257':
    'fp_wrestling_mattel_elite-then-now-forever_1_bam-bam-bigelow_e4251a',
  'fp_wrestling_mattel_elite_1_tyler-breeze_0a0ee3':
    'fp_wrestling_mattel_elite-then-now-forever_1_tyler-breeze_f3f180',
  'fp_wrestling_mattel_elite_1_yokozuna_076cb5':
    'fp_wrestling_mattel_elite-flashback_1_yokozuna_afefb8',
  'fp_wrestling_mattel_elite_2_doink-the-clown_0a1fba':
    'fp_wrestling_mattel_elite-flashback_2_doink-the-clown_0d187c',
  'fp_wrestling_mattel_elite_1_batista_ae47ca':
    'fp_wrestling_mattel_elite-hall-of-champions_1_batista_6d18c3',
  'fp_wrestling_mattel_elite_3_billy-gunn_c30694':
    'fp_wrestling_mattel_elite-hall-of-champions_3_billy-gunn_feac39',
  'fp_wrestling_mattel_elite_3_paul-bearer_773485':
    'fp_wrestling_mattel_elite-hall-of-champions_3_paul-bearer_1650c6',
  'fp_wrestling_mattel_elite_3_road-dogg_df29b4':
    'fp_wrestling_mattel_elite-hall-of-champions_3_road-dogg_c882cf',
  'fp_wrestling_mattel_elite_2_asuka_808922':
    'fp_wrestling_mattel_elite-network-spotlight_2_asuka_60773e',
  'fp_wrestling_mattel_elite_2_jinder-mahal_012edc':
    'fp_wrestling_mattel_elite-network-spotlight_2_jinder-mahal_6196ce',
  'fp_wrestling_mattel_elite_2_hacksaw-jim-duggan_3f83e0':
    'fp_wrestling_mattel_elite-retrofest_2_hacksaw-jim-duggan_717c38',
  'fp_wrestling_mattel_elite_2_honky-tonk-man_c96245':
    'fp_wrestling_mattel_elite-retrofest_2_honky-tonk-man_1283d6',
  'fp_wrestling_mattel_elite_1_mark-henry_988527':
    'fp_wrestling_mattel_elite-decade-of-domination_1_mark-henry_bb574e',
  'fp_wrestling_mattel_elite_2_beth-phoenix_bcd498':
    'fp_wrestling_mattel_elite-decade-of-domination_2_beth-phoenix_94e51a',
  'fp_wrestling_mattel_elite_3_wendi-richter_e2f7d2':
    'fp_wrestling_mattel_elite-network-spotlight_3_wendi-richter_9f1d21',
  'fp_wrestling_mattel_elite_1_shayna-baszler_4467d5':
    'fp_wrestling_mattel_elite-fan-takeover_1_shayna-baszler_0d1d52',
  'fp_wrestling_mattel_elite_2_johnny-gargano_ae964d':
    'fp_wrestling_mattel_elite-fan-takeover_2_johnny-gargano_93f9c7',
  'fp_wrestling_mattel_elite_1_gene-okerlund_a89338':
    'fp_wrestling_mattel_elite-flashback_1_gene-okerlund_b85202',
  'fp_wrestling_mattel_elite_3_harley-race_e2ad2d':
    'fp_wrestling_mattel_elite-flashback_3_harley-race_31570c',
  'fp_wrestling_mattel_elite_3_jake-roberts_955bc3':
    'fp_wrestling_mattel_elite-flashback_3_jake-roberts_266efd',
  'fp_wrestling_mattel_elite_2_bianca-belair_39d39c':
    'fp_wrestling_mattel_elite-street-fighter_2_bianca-belair_0762e3',
  'fp_wrestling_mattel_elite_2_faarooq_fbd93e':
    'fp_wrestling_mattel_elite-nation-of-domination_2pack_faarooq_3f0759',
}
