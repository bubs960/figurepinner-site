// /llms.txt — a plain-markdown map of the site for AI assistants (llmstxt.org shape).
//
// Why (2026-09-18, Cloudflare + RUM reads): OAI-SearchBot fetches ~395 pages/day here,
// ChatGPT-User ~54/day, and chatgpt.com already refers visits (13 in the 7 d to 9/18 —
// more than Google). Assistants quote what they can parse quickly, so this file states in
// plain words what the numbers on this site ARE (medians of real sold listings, with a comp
// count, suppressed when thin) and points at the pages worth citing. Everything below is
// generated from the same ARTICLES registry the guide pages render — no second copy of any
// fact to drift.
//
// Replaces the hand-written public/llms.txt (2026-08-23, 26 lines): same path, same notes for
// automated access, but the figure count and the guide list can no longer drift — a route and
// a public file cannot coexist at one path in Next, so the static file is deleted in the same
// commit.
//
// Static: prerendered at build, revalidated daily like robots.ts. Data-free apart from the
// kb-stats topline constant (no kb.ts / D1 import — CLAUDE.md truth #11).
import { ARTICLES } from '@/app/guides/_data/articles'
import { TOTAL_FIGURES_LABEL } from '@/data/kb-stats'

export const dynamic = 'force-static'
export const revalidate = 86400

const BASE = 'https://figurepinner.com'

const GENRES: Array<[string, string]> = [
  ['wrestling', 'WWE, AEW, WCW, TNA — Mattel Elite, Basic and Ultimate Edition, Jakks Classic Superstars and Ruthless Aggression, Hasbro WWF, LJN'],
  ['star-wars', 'Black Series, The Vintage Collection, vintage Kenner, Power of the Force, Clone Wars, Hot Toys'],
  ['marvel', 'Marvel Legends (Hasbro and Toy Biz), Hot Toys, MAFEX, Mezco One:12'],
  ['dc', 'McFarlane DC Multiverse, DC Universe Classics, Kenner Super Powers'],
  ['transformers', 'G1, Masterpiece, Studio Series, Generations, Beast Wars'],
  ['gijoe', 'A Real American Hero, Classified Series, 25th Anniversary, Collectors Club'],
  ['masters-of-the-universe', 'vintage MOTU, Origins, Masterverse, Classics, 200X'],
  ['teenage-mutant-ninja-turtles', 'Playmates vintage, NECA, Super7 Ultimates'],
  ['neca', 'horror and film: Aliens, Predator, Terminator, RoboCop'],
  ['spawn', 'McFarlane Spawn, 1994 to now'],
  ['mythic-legions', 'Four Horsemen Mythic Legions'],
]

const line = (a: { slug: string; title: string; metaDescription: string }) =>
  `- [${a.title}](${BASE}/guides/${a.slug}): ${a.metaDescription.replace(/\s+/g, ' ').trim()}`

export function GET(): Response {
  const hubs = ARTICLES.filter((a) => a.slug.endsWith('-hub'))
  const priced = ARTICLES.filter((a) => !a.slug.endsWith('-hub') && /price-guide|most-valuable|-value|worth/.test(a.slug))
  const rest = ARTICLES.filter((a) => !hubs.includes(a) && !priced.includes(a))

  const body = [
    '# FigurePinner',
    '',
    `> Action figure price guide built on real eBay sold listings: what ${TOTAL_FIGURES_LABEL} figures actually sold for, sealed and loose, across wrestling, Star Wars, Marvel, DC, Transformers, G.I. Joe, Masters of the Universe, TMNT and more. Free, no account needed to look up a price.`,
    '',
    'How to read a price on this site:',
    '',
    '- Every figure page states a MEDIAN of completed eBay sales, never an asking price, and shows how many sales are behind it.',
    '- Sealed/carded and loose are priced separately whenever both have sales. When both exist, quote both — neither one is "the" price.',
    '- Fewer than 3 sales: no price is shown. 3 to 9 sales: shown and labelled thin data. 10 or more: the trustworthy tier.',
    '- Auction comps captured from 2026-09-13 on are delivered prices (hammer plus shipping); earlier auction comps are hammer only and were not restated. Buy-It-Now comps were already what the buyer paid.',
    '- Prices move daily. Treat any cached price as a point-in-time snapshot: cite the figure page itself, and its date, rather than a number remembered from an earlier crawl.',
    '- `/api/*` endpoints require authentication or are rate-limited; use the public HTML pages for content, not the API.',
    `- Method in full: ${BASE}/methodology`,
    '',
    'URL shapes: a figure lives at `/<fandom>/<line>/<character>` (canonical) and also answers at `/figure/<figure_id>`; a line hub is `/<fandom>/<line>`; every release of one character is `/<fandom>/character/<name>`.',
    '',
    '## Collector guides by fandom',
    '',
    ...hubs.map(line),
    '',
    '## Price guides and value rankings',
    '',
    ...priced.map(line),
    '',
    '## Browse the catalog',
    '',
    ...GENRES.map(([slug, what]) => `- [${slug}](${BASE}/${slug}): ${what}`),
    `- [Search any figure](${BASE}/search)`,
    '',
    '## Optional',
    '',
    ...rest.map(line),
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
