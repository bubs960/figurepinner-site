/**
 * searchDisplay.ts — client-safe display constants shared by the search
 * surfaces (HeroSearch dropdown, /search cards, QuickLookAnchor).
 * NO KB imports — this ships in the client bundle.
 */

/**
 * D4 (Steve 2026-07-03): sold count is a confidence signal — show "· N sold"
 * ONLY when it strengthens trust. Below the floor render the median alone;
 * a thin count ("· 2 sold") advertises weak data. Same honest-flooring
 * pattern as the waitlist counter's >= 10 gate.
 */
export const SOLD_COUNT_CONFIDENCE_FLOOR = 5

/**
 * Search-genre slug → collector-facing display name (search genre pills).
 *
 * Keys are mostly raw KB fandoms, plus 'neca' — the one UI-level rollup, which
 * no KB fandom is ever equal to. Added 2026-07-27 alongside the search rollup:
 * the hero facet pill is fandomName()'s only caller, and without this entry a
 * rolled-up NECA pill fell through to the generic title-caser and rendered
 * "Neca" instead of the brand's actual capitalisation. The four rolled-up
 * members below (horror / aliens-predator / terminator / robocop) no longer
 * reach the pill, but their entries stay — they are still the correct display
 * names anywhere a raw fandom is shown.
 */
export const FANDOM_DISPLAY: Record<string, string> = {
  neca: 'NECA',
  wrestling: 'Wrestling',
  'star-wars': 'Star Wars',
  'marvel-comics': 'Marvel',
  dc: 'DC',
  transformers: 'Transformers',
  'gi-joe': 'GI Joe',
  'masters-of-the-universe': 'MOTU',
  tmnt: 'TMNT',
  'power-rangers': 'Power Rangers',
  'indiana-jones': 'Indiana Jones',
  ghostbusters: 'Ghostbusters',
  'mythic-legions': 'Mythic Legions',
  thundercats: 'ThunderCats',
  'action-force': 'Action Force',
  horror: 'Horror',
  'aliens-predator': 'Aliens & Predator',
  scifi: 'Sci-Fi',
  'pop-culture': 'Pop Culture',
  terminator: 'Terminator',
  robocop: 'RoboCop',
  spawn: 'Spawn',
  'generic-fantasy': 'Fantasy',
}

export function fandomName(slug: string): string {
  return (
    FANDOM_DISPLAY[slug] ??
    slug.split('-').map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ')
  )
}
