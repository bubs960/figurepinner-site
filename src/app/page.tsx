import type { Metadata } from 'next'
import HeroSearch from './components/HeroSearch'
import ShelfCase, { type ShelfFigure } from './components/ShelfCase'
import ScrollReveal from './components/ScrollReveal'
import SpotlightVitrine from './components/SpotlightVitrine'
import HeroTypeScrollDriver from './components/HeroTypeScrollDriver'
import GalleryTypeLayer from './components/GalleryTypeLayer'
import SiteHeader from './components/SiteHeader'
import AdSlot from '@/app/components/AdSlot'
import { fetchHomeMarket, type TapeItem, type ReceiptFigure } from './_lib/homeReceipt'
import ProvenanceTypeScrollDriver from './components/ProvenanceTypeScrollDriver'
import { TOTAL_FIGURES_LABEL } from '@/data/kb-stats'
import { GENRE_TAXONOMY } from '@/data/genre-lines'
import { getFigureById, getFiguresByLine, figureUrl } from '@/data/kb'
import { getFandom } from '@/lib/genreFigures'
import { thumb } from '@/lib/imageUrl'

export const metadata: Metadata = {
  title: { absolute: 'FigurePinner - Action Figure Price Guide' },
  description: `Real sold-price data for ${TOTAL_FIGURES_LABEL} action figures. Know what any figure is worth before you bid, buy, or sell.`,
  alternates: { canonical: 'https://figurepinner.com' },
}

// ── The shelf — curated, KB-resolved (entries that stop resolving or lose
//    their image are dropped at build, never shipped broken). This is a POOL,
//    not a fixed list: SHELF_COUNT are picked at random per render (see
//    pickShelfFids) so repeat visitors see a different shelf instead of the
//    same 12 figures every time (Steve, 2026-07-10 — "user sees same 8 or
//    whatever total cards on each visit that's a miss"). Rotation happens on
//    ISR regeneration (this route revalidates hourly), not on every reload.
const SHELF_COUNT = 12
const SHELF_POOL: Array<{ fid: string; tag: string }> = [
  // wrestling
  { fid: 'fp_wrestling_mattel_elite_112_becky-lynch_3d7e12', tag: 'Elite 112' },
  { fid: 'fp_wrestling_mattel_elite_100_the-rock_3c447b', tag: 'Elite 100' },
  { fid: 'fp_wrestling_mattel_ultimate-edition_25_cody-rhodes_83188e', tag: 'Ultimate Ed. 25' },
  { fid: 'fp_wrestling_mattel_elite_116_jade-cargill_dd785b', tag: 'Elite 116' },
  { fid: 'fp_wrestling_mattel_elite_1_edge_f3ac96', tag: 'Elite 1' },
  { fid: 'fp_wrestling_mattel_elite_1_undertaker_6eadf3', tag: 'Elite 1' },
  { fid: 'fp_wrestling_mattel_elite_26_roman-reigns_ed6a97', tag: 'Elite 26' },
  { fid: 'fp_wrestling_mattel_elite_25_seth-rollins_4f0cf5', tag: 'Elite 25' },
  { fid: 'fp_wrestling_mattel_ultimate-edition_5_john-cena_2b9a45', tag: 'Ultimate Ed. 5' },
  { fid: 'fp_wrestling_mattel_ultimate-edition_9_stone-cold-steve_41cafb', tag: 'Ultimate Ed. 9' },
  { fid: 'fp_wrestling_mattel_elite_84_rhea-ripley_10845a', tag: 'Elite 84' },
  { fid: 'fp_wrestling_mattel_elite_81_bianca-belair_786a59', tag: 'Elite 81' },
  // star wars
  { fid: 'fp_star-wars_hasbro_the-vintage-collection_the-vintage-collection-action-figures_darth-vader_a039ff', tag: 'Vintage Collection' },
  { fid: 'fp_star-wars_hasbro_the-vintage-collection_the-vintage-collection-action-figures_boba-fett_3bc65d', tag: 'Vintage Collection' },
  { fid: 'fp_star-wars_hasbro_black-series_galaxy_luke-skywalker_234457', tag: 'Black Series' },
  { fid: 'fp_star-wars_hasbro_black-series_orange-wave-2013_stormtrooper_ff3e42', tag: 'Black Series' },
  // gi joe
  { fid: 'fp_gi-joe_hasbro_a-real-american-hero_3-75-action-figures_snake-eyes_c47357', tag: 'Real American Hero' },
  { fid: 'fp_gi-joe_hasbro_a-real-american-hero_3-75-action-figures_cobra-commander_a9ccf4', tag: 'Real American Hero' },
  { fid: 'fp_gi-joe_hasbro_classified-series_classified_duke_23109e', tag: 'Classified Series' },
  { fid: 'fp_gi-joe_hasbro_classified-series_classified_storm-shadow_e06f94', tag: 'Classified Series' },
  { fid: 'fp_gi-joe_hasbro_classified-series_classified_destro_702404', tag: 'Classified Series' },
  { fid: 'fp_gi-joe_hasbro_classified-series_classified_scarlett_194b91', tag: 'Classified Series' },
  // motu
  { fid: 'fp_masters-of-the-universe_mattel_origins_origins-action-figures_skeletor_87c6a1', tag: 'Origins' },
  { fid: 'fp_masters-of-the-universe_mattel_origins_origins-action-figures_he-man_6814e4', tag: 'Origins' },
  { fid: 'fp_masters-of-the-universe_mattel_origins_origins-action-figures_beast-man_1db519', tag: 'Origins' },
  { fid: 'fp_masters-of-the-universe_mattel_origins_origins-action-figures_teela_720190', tag: 'Origins' },
  // transformers
  { fid: 'fp_transformers_hasbro_war-for-cybertron-kingdom_leader_optimus-prime_9524b9', tag: 'Kingdom' },
  { fid: 'fp_transformers_hasbro_studio-series_deluxe-class_bumblebee_5fe8e0', tag: 'Studio Series' },
  { fid: 'fp_transformers_hasbro_studio-series_leader-class_megatron_58242f', tag: 'Studio Series' },
  // marvel legends (new lane on the shelf)
  { fid: 'fp_marvel-comics_hasbro_marvel-legends_avengers_thanos_59d1dd', tag: 'Marvel Legends' },
  { fid: 'fp_marvel-comics_hasbro_marvel-legends_sentinel-baf_wolverine_c8b1f7', tag: 'Marvel Legends' },
  { fid: 'fp_marvel-comics_hasbro_marvel-legends_giant-man-baf_captain-america_7ae598', tag: 'Marvel Legends' },
  // dc multiverse (new lane on the shelf)
  { fid: 'fp_dc_mcfarlane_multiverse_mcfarlane_batman_5efc4c', tag: 'DC Multiverse' },
  { fid: 'fp_dc_mcfarlane_multiverse_mcfarlane_joker_00a342', tag: 'DC Multiverse' },
  // tmnt (new lane on the shelf)
  { fid: 'fp_tmnt_neca_ultimate_2024_leonardo_a6f2d6', tag: 'NECA Ultimate' },
  { fid: 'fp_tmnt_neca_ultimate_2023_michelangelo_774c4e', tag: 'NECA Ultimate' },
]

/** Fisher-Yates partial shuffle — picks `count` distinct entries from `pool`
 *  in random order. Server-only (this file never runs client-side), so
 *  Math.random() here is fine — it's per-render, not per-user-session. */
function pickShelfFids<T>(pool: T[], count: number): T[] {
  const arr = pool.slice()
  const n = Math.min(count, arr.length)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}
// fandom/line: which KB line represents this guide's bookplate photo (Room
// II, Museum Night S3 follow-up). null means no single line maps cleanly —
// that guide gets the CSS-only gold fallback plate instead of a photo.
const PRIORITY_GUIDES: Array<{
  href: string; label: string; kicker: string
  fandom: string | null; line: string | null
}> = [
  {
    href: '/guides/how-to-find-action-figure-values',
    label: 'Find a figure value',
    kicker: "Don't know what it's worth? Start here",
    fandom: null, line: null,
  },
  {
    href: '/guides/most-valuable-wwe-elite-figures',
    label: 'Most valuable WWE Elite figures',
    kicker: 'Pricing a Wrestling Elite? Start here',
    fandom: 'wrestling', line: 'elite',
  },
  {
    href: '/guides/marvel-legends-price-guide-2026',
    label: 'Marvel Legends price guide',
    kicker: 'What Marvel Legends collectors are paying',
    fandom: 'marvel', line: 'marvel-legends',
  },
  {
    href: '/guides/star-wars-black-series-hub',
    label: 'Star Wars Black Series guide',
    kicker: 'What Black Series collectors are paying',
    fandom: 'star-wars', line: 'black-series',
  },
  {
    href: '/guides/dc-multiverse-hub',
    label: 'DC Multiverse price guide',
    kicker: 'Chasing a Gold Label? Start here',
    fandom: 'dc', line: 'multiverse',
  },
  {
    href: '/guides/tmnt-hub',
    label: 'TMNT figure price guide',
    kicker: 'What NECA and Playmates TMNT go for',
    fandom: 'teenage-mutant-ninja-turtles', line: 'neca',
  },
]

function titleCase(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function isTinyThumbSafe(url: string | null): boolean {
  if (!url) return false
  return url.includes('cdn.shopify.com') || url.includes('i.ebayimg.com') || url.includes('/images/thumbs/')
}

/** Room II bookplate photo (Museum Night S3 follow-up): one representative,
 *  thumb-safe figure per guide's fandom/line. `fandom` here is the UI genre
 *  slug (same values PRIORITY_GUIDES/GENRE_TAXONOMY use elsewhere on this
 *  page) — getFandom() resolves it to the KB's actual fandom string where
 *  they differ (e.g. 'marvel' -> 'marvel-comics', 'teenage-mutant-ninja-
 *  turtles' -> 'tmnt'); calling getFiguresByLine with the raw UI slug
 *  silently returns zero rows for those two. Deterministic (first KB match,
 *  not shuffled) — this is a static-feeling badge, not the rotating shelf.
 *  Returns null (no line mapping, or no thumb-safe photo exists) so the
 *  caller falls back to the CSS-only gold plate instead of ever shipping an
 *  unresized image into a 56px badge. */
function guidePlateImg(fandom: string | null, line: string | null): string | null {
  if (!fandom || !line) return null
  const fig = getFiguresByLine(getFandom(fandom), line).find(f => isTinyThumbSafe(f.canonical_image_url ?? null))
  return fig ? thumb(fig.canonical_image_url!, 112) ?? null : null
}

/** Resolve curated shelf entries against the KB; real sold prices (from the
 *  tape) replace the line tag where we have one. */
function buildShelf(tape: TapeItem[]): ShelfFigure[] {
  const soldByFid = new Map<string, number>()
  for (const t of tape) {
    const m = /^\/figure\/(.+)$/.exec(t.href)
    if (m && !soldByFid.has(m[1])) soldByFid.set(m[1], t.price)
  }
  const resolved: Array<{ fig: ShelfFigure; safeHost: boolean }> = []
  // Shuffle the FULL pool and draw until SHELF_COUNT figures survive the
  // KB/photo filter below — not just shuffle-then-take-12. Drawing exactly
  // SHELF_COUNT first gave the filter zero real margin despite the pool
  // being 3x bigger (adversarial review caught this): a bad handful of
  // picks could silently collapse the shelf below its >=6 render gate.
  for (const entry of pickShelfFids(SHELF_POOL, SHELF_POOL.length)) {
    if (resolved.length >= SHELF_COUNT) break
    const kb = getFigureById(entry.fid)
    if (!kb || !kb.canonical_image_url) continue
    const sold = soldByFid.get(entry.fid)
    resolved.push({
      fig: {
        fid: entry.fid,
        href: figureUrl(kb),
        name: titleCase(kb.character_canonical),
        tag: sold != null ? 'Just sold' : entry.tag,
        sold: sold != null,
        img: thumb(kb.canonical_image_url, 180) ?? kb.canonical_image_url,
      },
      safeHost: isTinyThumbSafe(kb.canonical_image_url),
    })
  }
  // LCP guard: whichever figure lands at index 0 gets eager-load +
  // fetchPriority:high and is excluded from the curtain-rise entrance
  // animation (see ShelfCase.tsx / the data-shelf-idx CSS below) — it's
  // the single most performance-critical image on the page. thumb() only
  // resizes cdn.shopify.com/i.ebayimg.com; most of SHELF_POOL is R2-hosted
  // and passes through unresized. Reorder so a resize-safe entry always
  // lands first when this render's draw contains one, instead of leaving
  // it to chance which host ends up in the priority slot.
  const safeIdx = resolved.findIndex(r => r.safeHost)
  if (safeIdx > 0) {
    const [safe] = resolved.splice(safeIdx, 1)
    resolved.unshift(safe)
  }
  const out = resolved.map(r => r.fig)
  return out
}

/** Room III/IV (Museum Night S4): where the single hairline-mark dot sits on
 *  its 60px baseline. No sold_date field exists in the KB yet (see this
 *  file's own honesty-rules header), so "most recent sale" isn't a real
 *  signal here — the dot marks the median's own normalized position within
 *  [p10, p90] instead, which the placard text already states as the
 *  headline number. Honest, not a fabricated timeline point. */
function medianTickPosition(f: ReceiptFigure): number {
  const span = f.p90 - f.p10
  return span > 0 ? Math.min(1, Math.max(0, (f.median - f.p10) / span)) : 0.5
}

/** Shared card for the Provenance Wall corridor (Room III) and the closer's
 *  single flagship pick (Room IV) — `large` scales it up for the latter.
 *  Every card is a real `<a href="/figure/{fid}">` (the old ledger rows were
 *  unlinked plain divs with zero SEO value — Museum Night S4 fixes that). */
function VitrineCard({ f, large }: { f: ReceiptFigure; large?: boolean }) {
  const dotPos = medianTickPosition(f)
  return (
    <a className={`fph-vc${large ? ' large' : ''}`} href={f.href}>
      {f.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="fph-vc-img" src={f.image} alt="" loading="lazy" decoding="async" />
      )}
      <div className="fph-vc-body">
        <div className="fph-vc-name">{f.name}</div>
        <div className="fph-vc-line">{f.line}</div>
        <div className="fph-vc-placard">
          Median real sale: <strong>${f.median.toFixed(2)}</strong> &middot; {f.compCount} real solds tracked
        </div>
        <div className="fph-vc-conf" aria-hidden>
          {[1, 2, 3, 4, 5].map(n => (
            <span className={`dot${n <= f.confidence ? ' on' : ''}`} key={n} />
          ))}
        </div>
        <div className="fph-vc-hairline" aria-hidden>
          <span className="line" />
          <span className="mark" style={{ left: `${dotPos * 100}%` }} />
        </div>
      </div>
    </a>
  )
}

export default async function HomePage() {
  // Live market data — real solds or the modules hide themselves.
  const { figures: receiptFigures, tape } = await fetchHomeMarket()
  const shelf = buildShelf(tape)
  const laneCount = GENRE_TAXONOMY.length
  // Room I (Museum Night S3): top lanes by live figure count become large
  // featured vitrine tiles; the rest fall back to a compact floor directory.
  // Stable sort keeps GENRE_UI's editorial ordering as the tiebreaker.
  const FEATURED_LANE_COUNT = 6
  const rankedLanes = [...GENRE_TAXONOMY].sort((a, b) => b.figureCount - a.figureCount)
  const featuredLanes = rankedLanes.slice(0, FEATURED_LANE_COUNT)
  const floorLanes = rankedLanes.slice(FEATURED_LANE_COUNT)
  // Deterministic lean angles for Room II's book-spine cards — same each
  // build (server-rendered), cycles if there are ever more than 6 guides.
  const SPINE_LEAN_DEG = [-3, 2.4, -1.6, 3, -2.2, 1.4]
  // Bookplate photo per guide — null falls back to the CSS-only gold plate.
  const guidePlates = PRIORITY_GUIDES.map(g => guidePlateImg(g.fandom, g.line))
  // Room III (Museum Night S4): curated 6-8 wall, Steve's explicit density
  // call (2026-07-10) over an exhaustive 15-entry feed. receiptFigures is
  // already curated (CURATED array, homeReceipt.ts) so no further picking
  // logic is needed beyond a sane cap.
  const provenanceFigures = receiptFigures.slice(0, 8)
  // Room IV's single closing pick — the most data-backed figure (highest
  // confidence, real tiebreak on array order) rather than an arbitrary
  // index, matching this page's own "never a hopeful listing" honesty rule.
  const closerPick = provenanceFigures.length
    ? [...provenanceFigures].sort((a, b) => b.confidence - a.confidence)[0]
    : null

  return (
    <main className="fph">
      <style>{`
        .fph {
          --fph-cream: #f2e8d5;
          --fph-cream-dim: rgba(242,232,213,.76);
          --fph-cream-mut: rgba(242,232,213,.62);
          --fph-gold: var(--vitrine-gold);
          --fph-gold-hi: var(--vitrine-gold-hi);
          --fph-gold-mut: var(--vitrine-gold-mut);
          --fph-hair: rgba(242,232,213,.10);
          --fph-line: rgba(242,232,213,.07);
          --fph-mount: linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%);
          background: #09090f;
          color: #EEEEF5;
          font-family: var(--font-body, var(--fp-font-body, system-ui));
          min-height: 100vh;
          overflow-x: hidden;
        }
        .fph ::selection { background: var(--fph-gold); color: #1a1206; }
        .fph .wrap { max-width: 1240px; margin: 0 auto; padding: 0 32px; }
        .fph-seam { position: relative; }
        .fph-seam::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: min(1140px, 94%); height: 1px;
          background: linear-gradient(90deg, transparent, rgba(242,232,213,.13) 28%, rgba(224,168,62,.20) 50%, rgba(242,232,213,.13) 72%, transparent);
        }
        [data-fph-reveal] { opacity: 0; transform: translateY(22px); transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1); }
        [data-fph-reveal].in { opacity: 1; transform: none; }

        /* ── hero ── */
        .fph-hero {
          position: relative; padding: 48px 0 56px; overflow: hidden;
          background:
            radial-gradient(900px 520px at 78% -10%, rgba(224,168,62,.09), transparent 65%),
            radial-gradient(700px 500px at -10% 95%, rgba(0,102,255,.06), transparent 60%),
            #09090f;
        }
        .fph-hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1.04fr; gap: 68px; align-items: center; }
        .fph-hero-grid > * { min-width: 0; }

        /* ── Museum Night S2 — GalleryTypeLayer: giant decorative "GRAILS"
           background type, parallaxed via HeroTypeScrollDriver writing
           --parallax-y (0-1). Purely decorative: aria-hidden, no pointer
           events, out of flow, transform-only motion (no reflow), never
           the LCP element (H1/shelf image own that). ── */
        .fph-type-layer {
          position: absolute; inset: 0; z-index: 0;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none; overflow: hidden;
          transform: translateY(calc(var(--parallax-y, 0) * -70px));
          will-change: transform;
        }
        .fph-type-layer span {
          font-family: var(--fp-font-display); font-weight: 400;
          /* Floor was 220px, no mobile override — adversarial review found
             that on phones (<~647px, where 34vw drops below 220px) the
             text pinned at a still-oversized 220px, and since it's
             white-space:nowrap clipped by overflow:hidden, only a fragment
             of 1-2 letters would paint instead of a recognizable "GRAILS"
             watermark. A separate breakpoint override was tried first and
             rejected: its own vw formula didn't actually meet 220px at the
             640px boundary (real discontinuity, not the seamless join the
             first draft's comment claimed). Lowering the floor to 64px
             instead keeps the SAME 34vw scaling at every width — desktop
             is unaffected (34vw already exceeds 220px above ~647px, so the
             floor never engaged there anyway) and mobile now scales down
             smoothly with no separate rule needed. */
          font-size: clamp(64px, 34vw, 520px); line-height: .82;
          letter-spacing: .01em; white-space: nowrap;
          color: var(--fph-gold); opacity: .06;
        }
        /* Webaudit homepage-journey E1 (2026-07-10): museum-plaque kicker
           stacked above the H1 — names the page's function before a cold
           visitor has to infer it from the search box. Reuses
           .fph-room-eyebrow's type treatment (same 10px/.32em/gold-mut
           eyebrow already established for Rooms I/II) rather than a new
           one; the compound selector below overrides its nowrap (fine for
           short "ROOM I" labels, wrong for this much longer line) with
           higher specificity than source order alone would guarantee. */
        .fph-hero-eyebrow { display: block; margin-bottom: 10px; }
        .fph-hero-eyebrow.fph-room-eyebrow { white-space: normal; }
        .fph h1 {
          font-family: var(--fp-font-display); font-weight: 400;
          font-size: clamp(56px, 6.2vw, 94px);
          line-height: .94; letter-spacing: .012em; text-wrap: balance; margin: 0;
          color: #EEEEF5;
        }
        .fph h1 .grail { position: relative; color: var(--fph-gold); }
        .fph h1 .grail::after {
          content: attr(data-text); position: absolute; left: 0; top: 0; width: 100%;
          color: transparent; pointer-events: none;
          background: linear-gradient(115deg, transparent 40%, rgba(255,244,216,.95) 50%, transparent 60%);
          background-size: 260% 100%; background-position: 130% 0;
          -webkit-background-clip: text; background-clip: text;
          animation: fph-holo 6s linear infinite;
        }
        @keyframes fph-holo { 0% { background-position: 130% 0; } 14% { background-position: -40% 0; } 100% { background-position: -40% 0; } }
        .fph-hero-sub { margin-top: 24px; max-width: 520px; font-size: 16.5px; line-height: 1.7; font-weight: 300; color: var(--fph-cream-dim); }
        .fph-hero-sub strong { color: var(--fph-cream); font-weight: 500; }
        .fph-hero-search { margin-top: 30px; max-width: 520px; }
        /* HeroSearch is a shared client component with inline styles — scope
           the shelf-gold skin onto it here (important beats inline). Scoped
           to the specific "Run a price check" button, NOT a bare button
           selector: HeroSearch also renders a plain-text "Clear" button
           once a query is typed, and a bare selector forced the same solid
           gold background onto it too — Clear has no border-radius/matching
           padding (it was styled as inline text, not a pill), so the two
           differently-shaped same-color rectangles sitting side by side
           read as a broken, overlapping control (Steve, 2026-07-10). */
        .fph-hero-search button[aria-label="Run a price check"] {
          background: linear-gradient(180deg, #f5c462, #e0a83e) !important;
          color: #1a1206 !important;
        }
        .fph-hero-search input {
          border-color: rgba(242,232,213,.13) !important;
          background: rgba(242,232,213,.04) !important;
        }
        .fph-hero-search input:focus {
          border-color: rgba(224,168,62,.55) !important;
          box-shadow: 0 0 0 3px rgba(224,168,62,.10) !important;
        }
        .fph-hints { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .fph-hints span { font-size: 11.5px; font-weight: 300; color: var(--fph-cream-mut); margin-right: 2px; letter-spacing: .02em; }
        .fph-chip {
          font-size: 11.5px; font-weight: 400; letter-spacing: .03em; color: var(--fph-cream-dim);
          border: 1px solid rgba(242,232,213,.12); border-radius: 99px;
          padding: 4px 12px; text-decoration: none;
          transition: color .2s, border-color .2s, background .2s;
        }
        .fph-chip:hover { color: var(--fph-gold-hi); border-color: rgba(224,168,62,.45); background: rgba(224,168,62,.05); }
        /* Webaudit homepage-journey E2 (2026-07-10): "New? Start here" —
           the one existing chip written for a cold, no-search-term visitor
           (PRIORITY_GUIDES[0]'s own kicker), surfaced here as a solid-gold
           pointer instead of moving/duplicating the Wing Guide card three
           sections down. Same pill shape as the other hints chips, filled
           instead of outlined so it reads as "this one's for you." */
        .fph-chip.fph-chip-start {
          font-weight: 500; color: #1a1206; border-color: transparent;
          background: linear-gradient(180deg, var(--fph-gold-hi), var(--fph-gold));
        }
        .fph-chip.fph-chip-start:hover { color: #1a1206; background: linear-gradient(180deg, #f5c462, #e0a83e); border-color: transparent; }

        /* ── the case (markup in ShelfCase) ── */
        .fph-case {
          --mx: 50%; --my: 30%;
          position: relative; border-radius: 18px; padding: 38px 26px 22px;
          background:
            radial-gradient(130% 95% at 50% -5%, rgba(224,168,62,.10), transparent 56%),
            linear-gradient(180deg, rgba(242,232,213,.030), rgba(242,232,213,.012) 45%, rgba(0,0,0,.10) 100%);
          border: 1px solid var(--fph-hair);
          box-shadow: inset 0 1px 0 rgba(255,244,216,.08), inset 0 0 70px rgba(224,168,62,.045), 0 26px 70px rgba(0,0,0,.42);
          overflow: hidden;
        }
        .fph-case::before {
          content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
          background: radial-gradient(260px circle at var(--mx) var(--my), rgba(255,216,140,.12), transparent 62%);
          opacity: 0; transition: opacity .5s;
        }
        .fph-case.manual::before { opacity: 1; }
        .fph-case::after {
          content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 2px; z-index: 2;
          background: linear-gradient(90deg, transparent, rgba(245,196,98,.75), transparent);
          box-shadow: 0 0 18px 3px rgba(245,196,98,.28); border-radius: 0 0 3px 3px;
        }
        .fph-case-light {
          position: absolute; left: 50%; top: 42%; width: 1px; height: 1px; z-index: 3;
          pointer-events: none; opacity: 1; transition: opacity .6s;
          animation: fph-curtainLight .9s ease-out backwards, fph-driftX 12s ease-in-out infinite alternate;
        }
        /* Curtain-rise (Museum Night S2, load-time only, needs zero blocked
           assets): the case-light fades in on mount instead of snapping to
           full brightness immediately. 'backwards' (NOT 'both'/'forwards') is
           deliberate: forwards fill would permanently pin opacity via the
           animation cascade origin, silently breaking the pre-existing
           '.fph-case.manual .fph-case-light { opacity: 0; }' cursor-follow
           dim-out below (adversarial review caught this — forwards fill
           outranks normal-priority rules on the same property forever, not
           just during the animation). The "to" keyframe (opacity:1) already
           matches this element's static rest value, so releasing control
           after the animation ends produces no visual jump. */
        @keyframes fph-curtainLight { from { opacity: 0; } to { opacity: 1; } }
        .fph-case-light i {
          display: block; width: 560px; height: 560px; margin: -280px 0 0 -280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,216,140,.11), transparent 60%);
          animation: fph-driftY 6s ease-in-out infinite alternate;
        }
        .fph-case.manual .fph-case-light { opacity: 0; }
        @keyframes fph-driftX { from { transform: translateX(-170px); } to { transform: translateX(170px); } }
        @keyframes fph-driftY { from { transform: translateY(-80px); } to { transform: translateY(80px); } }
        .fph-case-sweep { position: absolute; inset: 0; z-index: 4; pointer-events: none; overflow: hidden; border-radius: 18px; }
        .fph-case-sweep::before {
          content: ''; position: absolute; top: -25%; bottom: -25%; left: 0; width: 32%;
          background: linear-gradient(100deg, transparent, rgba(255,236,194,.05) 32%, rgba(255,236,194,.12) 50%, rgba(255,236,194,.05) 68%, transparent);
          transform: translateX(-130%) skewX(-18deg);
          animation: fph-sweep 8s linear infinite;
        }
        @keyframes fph-sweep { 0% { transform: translateX(-130%) skewX(-18deg); } 24% { transform: translateX(480%) skewX(-18deg); } 100% { transform: translateX(480%) skewX(-18deg); } }
        .fph-case-label {
          position: absolute; top: 15px; left: 28px; z-index: 5;
          font-size: 10px; font-weight: 400; letter-spacing: .26em; text-transform: uppercase;
          color: rgba(242,232,213,.60);
        }
        /* Brass corner plates (Museum Night S2, "Vitrine One" framing) —
           static decorative CSS, no motion, clipped to the case's own
           rounded/overflow:hidden bounds, zero CWV surface. */
        .fph-case-plate {
          position: absolute; z-index: 5; width: 20px; height: 20px; pointer-events: none;
          background: linear-gradient(135deg, var(--fph-gold-hi), var(--fph-gold) 55%, #8a6420 100%);
          opacity: .5;
        }
        .fph-case-plate.tl { top: 0; left: 0; clip-path: polygon(0 0, 100% 0, 0 100%); }
        .fph-case-plate.tr { top: 0; right: 0; clip-path: polygon(0 0, 100% 0, 100% 100%); }
        .fph-case-plate.bl { bottom: 0; left: 0; clip-path: polygon(0 0, 100% 100%, 0 100%); }
        .fph-case-plate.br { bottom: 0; right: 0; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
        .fph-shelf { position: relative; padding: 0 6px 14px; margin-bottom: 30px; }
        .fph-shelf:last-of-type { margin-bottom: 6px; }
        .fph-shelf::after {
          content: ''; position: absolute; left: -10px; right: -10px; bottom: 0; height: 3px; border-radius: 2px;
          background: linear-gradient(180deg, rgba(255,236,194,.34), rgba(255,236,194,.06));
          box-shadow: 0 1px 0 rgba(255,244,216,.10), 0 10px 18px rgba(0,0,0,.38), 0 0 10px rgba(255,236,194,.10);
        }
        .fph-shelf-row { display: flex; gap: 14px; align-items: flex-end; position: relative; z-index: 1; }
        .fph-fig { flex: 1 1 0; min-width: 0; text-decoration: none; position: relative; padding-bottom: 9px; animation: fph-breathe 4.2s ease-in-out infinite alternate; }
        @keyframes fph-breathe { from { transform: translateY(0); } to { transform: translateY(-2px); } }
        .fph-shelf-row .fph-fig:nth-child(1) { animation-delay: -.2s; }
        .fph-shelf-row .fph-fig:nth-child(2) { animation-delay: -1.4s; animation-duration: 3.8s; }
        .fph-shelf-row .fph-fig:nth-child(3) { animation-delay: -2.7s; }
        .fph-shelf-row .fph-fig:nth-child(4) { animation-delay: -.8s; animation-duration: 4.6s; }
        .fph-shelf-row .fph-fig:nth-child(5) { animation-delay: -2s; animation-duration: 3.9s; }
        .fph-shelf-row .fph-fig:nth-child(6) { animation-delay: -3.2s; }
        .fph-fig:hover { animation-play-state: paused; }
        .fph-mount {
          position: relative; background: var(--fph-mount); border-radius: 6px 6px 3px 3px; padding: 5px 5px 6px;
          box-shadow: 0 10px 18px rgba(0,0,0,.42), 0 2px 4px rgba(0,0,0,.38);
          transition: transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s;
        }
        .fph-mount::after {
          content: ''; position: absolute; inset: -2px; border-radius: 8px 8px 5px 5px;
          border: 1px solid var(--fph-gold);
          box-shadow: 0 0 24px rgba(224,168,62,.45), inset 0 0 14px rgba(224,168,62,.15);
          opacity: 0; transition: opacity .45s; pointer-events: none;
        }
        .fph-mount img { width: 100%; aspect-ratio: 4/5.1; object-fit: cover; border-radius: 3px; background: #e9e0cd; display: block; }
        .fph-fig:hover .fph-mount { transform: translateY(-9px) rotate(-1.4deg); box-shadow: 0 24px 34px rgba(0,0,0,.55), 0 0 0 1px rgba(224,168,62,.5), 0 0 24px rgba(224,168,62,.16); }
        .fph-fig.pinned .fph-mount { box-shadow: 0 10px 18px rgba(0,0,0,.42), 0 0 0 1px var(--fph-gold), 0 0 20px rgba(224,168,62,.24); }
        .fph-fig.demo .fph-mount { transform: translateY(-6px); }
        .fph-fig.demo .fph-mount::after { opacity: 1; }
        /* Curtain-rise stagger (Museum Night S2): every shelf figure EXCEPT
           idx 0 (the LCP candidate, eager-loaded above) rises + fades in on
           mount. idx 0 is intentionally excluded from this selector — it
           renders at full opacity/position immediately, same as before this
           change, so the LCP paint is never delayed or entrance-animated.
           'backwards' fill (NOT 'both'/'forwards') is deliberate: this
           targets .fph-mount's own transform, the SAME property the
           hover-lift (line 335) and .demo pin-drop lift (line 337) rules
           already animate on the same element. A 'forwards'-filling
           animation permanently pins transform via the animation cascade
           origin, which outranks normal-priority rules forever — silently
           killing hover-lift and the demo's lift for every figure this
           targets (adversarial review caught this live: hover produced a
           shadow change but zero movement). The "to" keyframe
           (translateY(0), opacity:1) already matches the element's static
           rest state, so releasing control once the one-shot entrance ends
           is visually seamless and lets hover/demo regain the property. */
        @keyframes fph-mountRise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .fph-fig[data-shelf-idx]:not([data-shelf-idx="0"]) .fph-mount {
          animation: fph-mountRise .6s cubic-bezier(.22,.61,.36,1) backwards;
        }
        .fph-fig[data-shelf-idx="1"] .fph-mount { animation-delay: .06s; }
        .fph-fig[data-shelf-idx="2"] .fph-mount { animation-delay: .12s; }
        .fph-fig[data-shelf-idx="3"] .fph-mount { animation-delay: .18s; }
        .fph-fig[data-shelf-idx="4"] .fph-mount { animation-delay: .24s; }
        .fph-fig[data-shelf-idx="5"] .fph-mount { animation-delay: .30s; }
        .fph-fig[data-shelf-idx="6"] .fph-mount { animation-delay: .36s; }
        .fph-fig[data-shelf-idx="7"] .fph-mount { animation-delay: .42s; }
        .fph-fig[data-shelf-idx="8"] .fph-mount { animation-delay: .48s; }
        .fph-fig[data-shelf-idx="9"] .fph-mount { animation-delay: .54s; }
        .fph-fig[data-shelf-idx="10"] .fph-mount { animation-delay: .60s; }
        .fph-fig[data-shelf-idx="11"] .fph-mount { animation-delay: .66s; }
        .fph-fig-name { margin-top: 9px; font-size: 11.5px; font-weight: 500; color: var(--fph-cream); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-fig-tag { margin-top: 2px; font-size: 9.5px; font-weight: 400; letter-spacing: .11em; text-transform: uppercase; color: var(--fph-cream-mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-fig-tag.sold { color: var(--fph-gold-hi); }
        .fph-fig-tag.sold::before {
          content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%;
          background: var(--fph-gold); margin-right: 5px; vertical-align: 1px;
          box-shadow: 0 0 6px rgba(224,168,62,.9);
        }
        .fph-pin-btn {
          position: absolute; top: -11px; right: -9px; z-index: 5;
          width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(180deg, var(--fph-gold-hi), var(--fph-gold));
          color: #1a1206; display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: scale(.55) rotate(-12deg);
          transition: opacity .25s, transform .3s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 4px 11px rgba(0,0,0,.45);
        }
        .fph-pin-btn svg { width: 13px; height: 13px; }
        .fph-fig:hover .fph-pin-btn, .fph-fig.pinned .fph-pin-btn { opacity: 1; transform: scale(1) rotate(0deg); }
        .fph-fig.demo .fph-pin-btn { opacity: 1; animation: fph-pinDrop .55s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes fph-pinDrop {
          0% { transform: translateY(-18px) scale(1.4) rotate(-20deg); opacity: 0; }
          60% { transform: translateY(1px) scale(.94) rotate(4deg); opacity: 1; }
          100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
        }
        .fph-fig.pinned .fph-pin-btn { background: linear-gradient(180deg, #fff0d0, var(--fph-gold-hi)); box-shadow: 0 4px 11px rgba(0,0,0,.45), 0 0 13px rgba(224,168,62,.65); }
        .fph-tray {
          margin-top: 18px; display: flex; align-items: center; gap: 12px;
          border: 1px dashed rgba(224,168,62,.32); border-radius: 99px;
          padding: 8px 18px; min-height: 48px; background: rgba(224,168,62,.03);
          transition: border-color .3s, background .3s;
        }
        .fph-tray.active { border-style: solid; border-color: rgba(224,168,62,.5); background: rgba(224,168,62,.06); }
        .fph-tray-pin { flex: 0 0 auto; color: var(--fph-gold); width: 16px; height: 16px; }
        .fph-tray-thumbs { display: flex; flex: 0 0 auto; transition: opacity .45s; }
        .fph-tray-thumbs.clearing { opacity: 0; }
        .fph-tray-thumbs img {
          width: 28px; height: 28px; border-radius: 50%; object-fit: cover;
          border: 1.5px solid #2a2008; margin-left: -9px; background: #efe5d0;
          animation: fph-thumbIn .35s cubic-bezier(.34,1.56,.64,1) both;
        }
        .fph-tray-thumbs img:first-child { margin-left: 0; }
        @keyframes fph-thumbIn { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .fph-tray-text { font-size: 12.5px; font-weight: 300; color: var(--fph-cream-dim); line-height: 1.45; }
        .fph-tray-text strong { color: var(--fph-cream); font-weight: 500; }
        .fph-tray-cta {
          margin-left: auto; flex: 0 0 auto; font-size: 12.5px; font-weight: 500;
          color: var(--fph-gold-hi); text-decoration: none; white-space: nowrap;
          border-bottom: 1px solid rgba(224,168,62,.35); transition: border-color .2s; display: none;
        }
        .fph-tray-cta:hover { border-color: var(--fph-gold-hi); }
        .fph-tray.active .fph-tray-cta { display: inline; }
        .fph-fly-thumb {
          position: fixed; z-index: 90; pointer-events: none; object-fit: cover; border-radius: 4px;
          box-shadow: 0 10px 26px rgba(0,0,0,.55); will-change: transform, opacity;
          transition: transform .72s cubic-bezier(.5,.05,.35,1), opacity .72s ease, border-radius .72s ease;
        }

        /* ── lanes / Room I gallery (Museum Night S3) ── */
        .fph-gallery { padding: 34px 0 30px; }
        .fph-room-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 18px; }
        .fph-room-eyebrow {
          font-size: 10px; font-weight: 600; letter-spacing: .32em; text-transform: uppercase;
          color: var(--fph-gold-mut); white-space: nowrap;
        }
        .fph-vitrine-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px; margin-bottom: 24px;
        }
        .fph-vitrine-tile {
          --accent: var(--fph-gold);
          position: relative; display: block; min-width: 0; padding: 18px 18px 16px;
          border: 1px solid rgba(242,232,213,.10); border-radius: 12px;
          background: rgba(242,232,213,.025); text-decoration: none;
          transition: transform .3s cubic-bezier(.22,.61,.36,1), border-color .3s, background .3s, box-shadow .3s;
        }
        .fph-vitrine-tile:hover {
          transform: translateY(-4px) rotate(-.4deg);
          border-color: rgba(224,168,62,.42);
          box-shadow: 0 14px 26px rgba(0,0,0,.4), 0 0 0 1px rgba(224,168,62,.32), 0 0 18px rgba(224,168,62,.16);
        }
        .fph-vitrine-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .fph-vitrine-name {
          font-family: var(--fp-font-display); font-size: 19px; letter-spacing: .01em; color: var(--fph-cream);
          border-bottom: 1px solid var(--accent); padding-bottom: 2px; opacity: .96;
        }
        .fph-vitrine-count { font-size: 11px; font-weight: 400; color: var(--fph-cream-mut); white-space: nowrap; }
        .fph-vitrine-lines { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
        .fph-vline { display: flex; align-items: baseline; gap: 7px; font-size: 11px; color: var(--fph-cream-dim); }
        .fph-vline-name { font-weight: 500; color: var(--fph-cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-vline-years { font-size: 9.5px; color: var(--fph-cream-mut); white-space: nowrap; }
        .fph-vbadge {
          flex: 0 0 auto; font-size: 8px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          padding: 2px 5px; border-radius: 3px; color: #1a1206; background: var(--fph-gold-mut);
        }
        .fph-vbadge.hot { background: var(--fph-gold); }
        .fph-vbadge.premium { background: linear-gradient(180deg, var(--fph-gold-hi), var(--fph-gold)); }
        .fph-vbadge.vintage { background: rgba(242,232,213,.55); }
        .fph-vbadge.new { background: #7fd9a8; }
        .fph-vitrine-desc {
          margin: 10px 0 0; font-size: 11.5px; line-height: 1.5; font-weight: 300; color: var(--fph-cream-mut);
        }
        .fph-floor-row { display: flex; flex-wrap: wrap; gap: 10px 9px; align-items: center; }
        .fph-lane-kicker {
          font-size: 11px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;
          color: var(--fph-gold); display: inline-flex; align-items: center; gap: 12px; margin-right: 16px;
        }
        .fph-lane-kicker::before { content: ''; width: 34px; height: 1px; background: linear-gradient(90deg, transparent, var(--fph-gold)); opacity: .7; }
        .fph-lane-chip {
          display: inline-flex; align-items: baseline; gap: 8px;
          font-size: 11.5px; font-weight: 400; letter-spacing: .10em; text-transform: uppercase;
          color: var(--fph-cream-dim);
          border: 1px solid rgba(242,232,213,.13); border-radius: 99px;
          padding: 7px 16px; text-decoration: none; line-height: 1.2; background: transparent;
          transition: border-color .25s, transform .25s, background .25s, color .25s;
        }
        .fph-lane-chip .ct { font-size: 10px; font-weight: 400; letter-spacing: .08em; color: var(--fph-gold-mut); }
        .fph-lane-chip:hover { border-color: rgba(224,168,62,.42); color: var(--fph-cream); transform: translateY(-2px); background: rgba(224,168,62,.04); }
        .fph-lane-chip.all { border-style: dashed; border-color: rgba(224,168,62,.30); color: var(--fph-gold-hi); }
        .fph-lane-chip.all:hover { border-style: solid; }
        [data-fph-stagger] .fph-lane-kicker, [data-fph-stagger] .fph-lane-chip {
          opacity: 0; transform: translateY(14px);
          transition: opacity .55s cubic-bezier(.22,.61,.36,1), transform .55s cubic-bezier(.22,.61,.36,1), border-color .25s, background .25s, color .25s;
        }
        [data-fph-stagger].in .fph-lane-kicker, [data-fph-stagger].in .fph-lane-chip { opacity: 1; transform: none; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(2) { transition-delay: .05s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(3) { transition-delay: .1s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(4) { transition-delay: .15s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(5) { transition-delay: .2s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(6) { transition-delay: .25s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(7) { transition-delay: .3s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(8) { transition-delay: .35s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(9) { transition-delay: .4s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(10) { transition-delay: .45s; }
        [data-fph-stagger].in .fph-lane-chip:nth-child(11) { transition-delay: .5s; }
        [data-fph-stagger].in .fph-lane-chip:hover { transition-delay: 0s; }
        [data-fph-stagger] .fph-vitrine-tile {
          opacity: 0; transform: translateY(16px);
          transition: opacity .55s cubic-bezier(.22,.61,.36,1), transform .55s cubic-bezier(.22,.61,.36,1), border-color .3s, background .3s, box-shadow .3s;
        }
        [data-fph-stagger].in .fph-vitrine-tile { opacity: 1; transform: none; }
        [data-fph-stagger].in .fph-vitrine-tile:nth-child(2) { transition-delay: .07s; }
        [data-fph-stagger].in .fph-vitrine-tile:nth-child(3) { transition-delay: .14s; }
        [data-fph-stagger].in .fph-vitrine-tile:nth-child(4) { transition-delay: .21s; }
        [data-fph-stagger].in .fph-vitrine-tile:nth-child(5) { transition-delay: .28s; }
        [data-fph-stagger].in .fph-vitrine-tile:nth-child(6) { transition-delay: .35s; }
        [data-fph-stagger].in .fph-vitrine-tile:hover { transition-delay: 0s; }

        /* ── Room II — Wing Guide book-spine cards (Museum Night S3) ── */
        .fph-wing { padding: 26px 0 30px; background: rgba(242,232,213,.018); }
        .fph-guide-head {
          display: flex; align-items: end; justify-content: space-between; gap: 24px;
          margin-bottom: 14px;
        }
        .fph-guide-title {
          font-size: 11px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;
          color: var(--fph-gold); margin: 0;
        }
        .fph-guide-copy {
          margin: 5px 0 0; max-width: 620px;
          font-size: 13px; line-height: 1.6; color: var(--fph-cream-mut);
        }
        .fph-guide-all {
          flex: 0 0 auto; color: var(--fph-cream-dim); text-decoration: none;
          font-size: 12px; font-weight: 500; border-bottom: 1px solid rgba(242,232,213,.22);
        }
        .fph-guide-all:hover { color: var(--fph-gold-hi); border-color: rgba(224,168,62,.55); }
        /* Shared slow-gleam sheen — reuses the existing fph-sweep keyframe
           (defined above for the case light-sweep) instead of a new
           mechanism. --sheen-delay staggers instances so they never move
           in sync. */
        .gallery-sheen {
          position: absolute; top: -25%; bottom: -25%; left: 0; width: 30%; z-index: 1;
          background: linear-gradient(100deg, transparent, rgba(255,236,194,.10) 32%, rgba(255,236,194,.18) 50%, rgba(255,236,194,.10) 68%, transparent);
          transform: translateX(-130%) skewX(-18deg); pointer-events: none;
          animation: fph-sweep 9s linear infinite;
          animation-delay: var(--sheen-delay, 0s);
        }
        .fph-spine-shelf {
          position: relative; display: flex; align-items: flex-end; gap: 12px; padding-top: 8px;
        }
        .fph-spine-shelf::after {
          content: ''; position: absolute; left: -10px; right: -10px; bottom: 0; height: 3px; border-radius: 2px;
          background: linear-gradient(180deg, rgba(255,236,194,.34), rgba(255,236,194,.06));
          box-shadow: 0 1px 0 rgba(255,244,216,.10), 0 10px 18px rgba(0,0,0,.38), 0 0 10px rgba(255,236,194,.10);
        }
        .fph-spine {
          position: relative; flex: 1 1 0; min-width: 0; overflow: hidden;
          display: flex; flex-direction: column; justify-content: flex-end;
          min-height: 190px; padding: 16px 14px 18px; text-decoration: none;
          border: 1px solid rgba(242,232,213,.11); border-radius: 8px 8px 3px 3px;
          background: linear-gradient(180deg, rgba(242,232,213,.05), rgba(242,232,213,.02) 55%, rgba(0,0,0,.12) 100%);
          transform: rotate(var(--lean, 0deg)); transform-origin: bottom center;
          transition: transform .35s cubic-bezier(.22,.61,.36,1), border-color .3s, box-shadow .3s;
        }
        .fph-spine:hover, .fph-spine:focus-visible {
          transform: rotate(0deg) translateY(-3px);
          border-color: rgba(224,168,62,.42);
          box-shadow: 0 12px 22px rgba(0,0,0,.4), 0 0 0 1px rgba(224,168,62,.3), 0 0 16px rgba(224,168,62,.15);
        }
        /* Bookplate badge (Museum Night S3 follow-up) — an ex-libris circle
           breaking the spine's top edge, like a photo plate on a book cover.
           Absolutely positioned (NOT a flex child): .fph-spine is
           justify-content:flex-end, so a normal-flow child would just join
           the kicker/label cluster at the bottom instead of sitting at the
           top; overflow:hidden on .fph-spine also means a negative-offset
           trick to "break the border" would get clipped. z-index:2 puts it
           above .gallery-sheen/kicker/label (both z-index:1) so the sheen
           sweep visibly glides UNDER the photo. It rotates/straightens with
           the card for free — no separate transform, it's just a descendant
           of the element that owns --lean. */
        .fph-spine-plate {
          position: absolute; top: 14px; left: 50%; transform: translateX(-50%); z-index: 2;
          width: 56px; height: 56px; border-radius: 50%; overflow: hidden;
          border: 1.5px solid rgba(224,168,62,.45); background: #efe5d0;
          box-shadow: 0 1px 0 rgba(255,255,255,.15) inset, 0 3px 8px rgba(0,0,0,.35);
        }
        .fph-spine-plate img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fph-spine-plate--fallback {
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--fph-gold-hi), var(--fph-gold) 55%, #8a6420 100%);
        }
        .fph-spine-kicker {
          display: block; margin-bottom: 8px; position: relative; z-index: 1;
          font-size: 9px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
          color: var(--fph-gold-mut);
        }
        .fph-spine-label {
          display: block; position: relative; z-index: 1;
          font-size: 13px; line-height: 1.3; font-weight: 500; color: var(--fph-cream);
        }

        /* ── Room III — Provenance Wall (Museum Night S4) ──
           Second (final) GalleryTypeLayer instance lives here — two max on
           the page, Hero + this one, per the audit's own v1 scope cut.
           Parallax via ProvenanceTypeScrollDriver, IO-gated so it only runs
           while this section is actually in view (the spec's own risk
           register flags "two parallax layers" as the thing to manage). */
        .fph-provenance { position: relative; overflow: hidden; padding: 40px 0 30px; }
        .fph-provenance .fph-room-head { padding: 0 32px; max-width: 1240px; margin-left: auto; margin-right: auto; }
        .fph-corridor-wrap { position: relative; margin-top: 6px; }
        .fph-corridor-wrap .fade-l, .fph-corridor-wrap .fade-r {
          position: absolute; top: 0; bottom: 0; width: 60px; z-index: 2; pointer-events: none;
        }
        .fph-corridor-wrap .fade-l { left: 0; background: linear-gradient(90deg, #09090f, transparent); }
        .fph-corridor-wrap .fade-r { right: 0; background: linear-gradient(270deg, #09090f, transparent); }
        /* User-driven scroll, NOT an autoplaying marquee — the mechanical
           difference from the old ticker that kills the "stock exchange"
           feeling. Native overflow scroll + snap, no JS scroll-hijacking. */
        .fph-corridor {
          display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x proximity;
          padding: 4px 32px 10px; scrollbar-width: none;
        }
        .fph-corridor::-webkit-scrollbar { display: none; }
        .fph-corridor-dots { display: flex; justify-content: center; gap: 6px; margin-top: 2px; }
        .fph-corridor-dots .dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(242,232,213,.18); }
        .fph-provenance-foot {
          margin-top: 18px; font-size: 11.5px; font-weight: 300; color: var(--fph-cream-mut);
          line-height: 1.55; text-align: center;
        }

        /* ── VitrineCard — shared by the Room III corridor and Room IV's
           single closing pick (.large). Every card is a real figure-page
           link (the old ledger rows were unlinked plain divs — zero SEO
           value; this is the standing fix). ── */
        .fph-vc {
          flex: 0 0 auto; scroll-snap-align: center; width: 200px; text-decoration: none;
          display: block; border: 1px solid rgba(242,232,213,.11); border-radius: 12px;
          background: linear-gradient(180deg, rgba(242,232,213,.035), transparent 55%);
          overflow: hidden; transition: transform .3s cubic-bezier(.22,.61,.36,1), border-color .3s, box-shadow .3s;
        }
        .fph-vc:hover {
          transform: translateY(-4px); border-color: rgba(224,168,62,.4);
          box-shadow: 0 14px 26px rgba(0,0,0,.4), 0 0 0 1px rgba(224,168,62,.3), 0 0 18px rgba(224,168,62,.15);
        }
        /* Aspect ratio matches .fph-mount img's proven 4/5.1 (the shelf's own
           full-body-figure photo convention) instead of a landscape-ish box —
           these source photos are portrait (full-body upright figure or
           package art), and a wider box forces a much bigger vertical crop.
           object-position biases that crop toward the top: every one of
           these photos puts the identity-critical content (face, cowl, head)
           in the top portion of frame, so favoring the top over dead-center
           trades a bit of extra background/base at the bottom (the least
           important content) instead of cutting into the figure's head
           (confirmed live 2026-07-10 — Steve caught Hulk Hogan's face
           getting cut off under the old 4/3 dead-center crop). */
        .fph-vc-img { width: 100%; aspect-ratio: 4/5.1; object-fit: cover; object-position: 50% 10%; display: block; background: #e9e0cd; }
        .fph-vc-body { padding: 12px 14px 14px; }
        .fph-vc-name { font-size: 13.5px; font-weight: 600; color: var(--fph-cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-vc-line { margin-top: 2px; font-size: 9.5px; font-weight: 400; letter-spacing: .1em; text-transform: uppercase; color: var(--fph-cream-mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-vc-placard { margin-top: 9px; font-size: 11px; line-height: 1.5; color: var(--fph-cream-dim); }
        .fph-vc-placard strong { font-family: var(--fp-font-display); font-size: 15px; font-weight: 400; letter-spacing: .02em; color: var(--fph-gold-hi); }
        .fph-vc-conf { margin-top: 9px; display: flex; gap: 4px; }
        .fph-vc-conf .dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(242,232,213,.16); }
        .fph-vc-conf .dot.on { background: var(--fph-gold); box-shadow: 0 0 5px rgba(224,168,62,.6); }
        /* The hairline provenance mark — deliberately foreshadows the
           Liquid Gold Sparkline (next in the build order after Museum
           Night). The single gold mark sits at the median's own normalized
           position within [p10,p90] (see medianTickPosition()) — not a
           fabricated "latest sale" timeline point; no sold_date field
           exists in the KB yet. */
        .fph-vc-hairline { position: relative; margin-top: 10px; width: 60px; height: 8px; }
        .fph-vc-hairline .line { position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: rgba(242,232,213,.16); }
        .fph-vc-hairline .mark {
          position: absolute; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px;
          border-radius: 50%; background: var(--fph-gold); box-shadow: 0 0 6px rgba(224,168,62,.7);
        }
        .fph-vc.large { width: 100%; max-width: 380px; }
        .fph-vc.large .fph-vc-body { padding: 16px 20px 20px; }
        .fph-vc.large .fph-vc-name { font-size: 17px; white-space: normal; }
        .fph-vc.large .fph-vc-placard { font-size: 12.5px; }
        .fph-vc.large .fph-vc-placard strong { font-size: 18px; }
        .fph-closer-pick { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }

        /* ── closer ── */
        .fph-closer {
          padding: 60px 0 64px;
          background:
            radial-gradient(800px 420px at 12% 0%, rgba(224,168,62,.05), transparent 60%),
            radial-gradient(700px 420px at 92% 100%, rgba(224,168,62,.03), transparent 60%);
        }
        .fph-closer-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 60px; align-items: center; }
        .fph-closer-grid > * { min-width: 0; }
        .fph h2 {
          font-family: var(--fp-font-display); font-weight: 400;
          font-size: clamp(40px, 4.4vw, 62px); line-height: .98; letter-spacing: .012em;
          text-wrap: balance; margin: 0; color: #EEEEF5;
        }
        .fph-closer-sub { margin-top: 18px; font-size: 15.5px; font-weight: 300; color: var(--fph-cream-dim); max-width: 480px; line-height: 1.7; }
        .fph-closer-cta-row { margin-top: 28px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .fph-btn-gold {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 500; letter-spacing: .04em;
          color: #1a1206; background: linear-gradient(180deg, var(--fph-gold-hi), var(--fph-gold));
          padding: 12px 27px; border-radius: 99px; text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 1px 0 rgba(255,255,255,.22) inset, 0 4px 14px rgba(224,168,62,.16);
          transition: transform .2s, box-shadow .2s;
        }
        .fph-btn-gold:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(255,255,255,.22) inset, 0 8px 20px rgba(224,168,62,.28); }
        .fph-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12.5px; font-weight: 500; letter-spacing: .04em; color: var(--fph-cream-dim);
          padding: 8px 17px; border-radius: 99px; text-decoration: none;
          border: 1px solid rgba(242,232,213,.16);
          transition: border-color .2s, color .2s, background .2s;
        }
        .fph-btn-ghost:hover { border-color: rgba(224,168,62,.5); color: var(--fph-cream); background: rgba(224,168,62,.05); }

        /* ── reduced motion: freeze to a good static state ── */
        @media (prefers-reduced-motion: reduce) {
          [data-fph-reveal] { opacity: 1; transform: none; transition: none; }
          [data-fph-stagger] .fph-lane-kicker, [data-fph-stagger] .fph-lane-chip { opacity: 1; transform: none; transition: none; }
          .fph-fig { animation: none !important; }
          /* Hover lift/tilt/glow is user-initiated (not automatic), but this is
             the reference pattern every other card hover gets promoted from
             (WP2, 2026-07-05) — zero it here too so the "reduced motion"
             hover contract is unambiguous for whoever copies it next. */
          .fph-fig:hover .fph-mount { transform: none; transition: none; }
          .fph-case-light, .fph-case-sweep { display: none; }
          .fph-case::before { display: none; }
          .fph h1 .grail::after { display: none; }
          .fph-tray-thumbs img { animation: none !important; }
          .fph-fly-thumb { display: none; }
          /* Museum Night S2 additions: type layer freezes at its composed
             rest position (driver never attaches; default --parallax-y:0
             already means transform:translateY(0), this is defensive/
             explicit to match the pattern above); curtain-rise mount
             entrance is disabled — figures render at rest state
             immediately instead of playing the staggered rise. */
          .fph-type-layer { transform: none !important; }
          .fph-mount { animation: none !important; opacity: 1 !important; transform: none !important; }
          /* Museum Night S3 additions: Room I/II reveal-in staggers snap to
             their rest state immediately (same [data-fph-reveal]/
             [data-fph-stagger] contract as above); the two card hovers
             follow the same "zero it for contract consistency" rule as
             .fph-fig:hover above, even though hover is user-initiated. The
             sheen is a continuous decorative loop, same category as the
             case light-sweep already killed here. */
          [data-fph-stagger] .fph-vitrine-tile { opacity: 1; transform: none; transition: none; }
          .fph-vitrine-tile:hover { transform: none; transition: none; }
          .fph-spine { transition: none; }
          .fph-spine:hover, .fph-spine:focus-visible { transform: rotate(var(--lean, 0deg)); }
          .gallery-sheen { display: none; }
          /* Museum Night S4 additions: Room III's type-layer parallax is
             already covered by the generic .fph-type-layer rule above
             (ProvenanceTypeScrollDriver never attaches under reduced
             motion regardless); the corridor's scroll-snap is native
             user-driven scrolling, not a CSS animation, so it needs no
             override. VitrineCard hover follows the same "zero it for
             contract consistency" rule as every other card hover here. */
          .fph-vc:hover { transform: none; transition: none; }
        }

        /* ── responsive ── */
        @media (pointer: coarse) {
          .fph a, .fph button { touch-action: manipulation; }
          .fph-chip, .fph-lane-chip, .fph-guide-all, .fph-btn-gold, .fph-btn-ghost {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
          }
          .fph-tray-cta { min-height: 44px; align-items: center; }
          .fph-tray.active .fph-tray-cta { display: inline-flex; }
          .fph-pin-btn {
            width: 44px;
            height: 44px;
            top: -18px;
            right: -16px;
          }
          .fph-pin-btn svg { width: 16px; height: 16px; }
        }
        @media (max-width: 1020px) {
          .fph-hero-grid { grid-template-columns: 1fr; gap: 56px; }
          .fph-hero-sub, .fph-hero-search { max-width: 640px; }
          .fph-closer-grid { grid-template-columns: 1fr; gap: 40px; }
          .fph-vitrine-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .fph-spine-shelf { flex-wrap: wrap; }
          .fph-spine { flex: 1 1 150px; }
        }
        @media (max-width: 640px) {
          .fph .wrap { padding: 0 20px; }
          .fph-hero { padding: 40px 0 48px; }
          /* Steve, 2026-07-10: "not seeing a big difference from mobile" —
             both correct calls. The type layer's 6% opacity (fine on a
             desktop screenshot) and 20px brass plates read as basically
             invisible on a phone at a glance: no scroll (parallax never
             triggers), and the curtain-rise is a one-shot ~1.3s animation
             easy to miss on a fast-loading page — the type layer is the
             ONLY rest-state difference that doesn't depend on timing or
             scrolling, so it's the one lever worth strengthening here.
             Desktop opacity/size stay at the original spec'd values. */
          .fph-type-layer span { opacity: .11; }
          .fph-case-plate { width: 30px; height: 30px; opacity: .65; }
          .fph-case { padding: 34px 14px 20px; }
          .fph-case-label { left: 18px; }
          .fph-shelf { padding: 0 2px 14px; }
          .fph-shelf-row { overflow-x: auto; scrollbar-width: none; padding-top: 14px; margin-top: -14px; }
          .fph-shelf-row::-webkit-scrollbar { display: none; }
          .fph-fig { flex: 0 0 108px; }
          .fph-provenance .fph-room-head { padding: 0 20px; }
          .fph-corridor { padding: 4px 20px 10px; }
          .fph-vc { width: 168px; }
          .fph-gallery { padding: 28px 0 24px; }
          .fph-lane-kicker { width: 100%; margin-right: 0; margin-bottom: 2px; }
          .fph-lane-chip { padding: 7px 14px; font-size: 11px; }
          .fph-vitrine-grid { grid-template-columns: 1fr; }
          .fph-guide-head { display: block; }
          .fph-guide-all { display: inline-block; margin-top: 10px; }
          /* Leaning book spines only read cleanly with room to breathe —
             stack full-width and drop the lean on narrow screens so every
             spine's text is upright and legible without needing hover. */
          .fph-spine-shelf { flex-direction: column; }
          /* Extra top padding makes room for the absolutely-positioned
             bookplate badge below — .fph-spine is auto-height here (no
             surplus for flex-end to push content into), so without this the
             badge would sit directly over the kicker text instead of above
             it. */
          .fph-spine { min-height: auto; padding: 58px 16px 14px; transform: none; }
          .fph-spine:hover, .fph-spine:focus-visible { transform: translateY(-1px); }
          .fph-spine-plate { width: 40px; height: 40px; top: 10px; }
          .fph-closer { padding: 46px 0 50px; }
          .fph-vc.large { max-width: 100%; }
          .fph-tray { flex-wrap: wrap; border-radius: 16px; }
          .fph-tray-cta { margin-left: 0; }
        }
      `}</style>

      <SiteHeader />
      <ScrollReveal />
      <HeroTypeScrollDriver />
      <ProvenanceTypeScrollDriver />

      {/* ── HERO ── */}
      <section className="fph-hero">
        {/* GalleryTypeLayer — decorative only, aria-hidden, out of flow,
            client-mounted only (see component) so it's never an LCP
            candidate; H1 + shelf image own that. */}
        <GalleryTypeLayer text="GRAILS" />
        <div className="wrap fph-hero-grid">
          <div>
            <span className="fph-room-eyebrow fph-hero-eyebrow">The collector&apos;s price guide &mdash; not another marketplace.</span>
            <h1>Every <span className="grail" data-text="grail">grail</span> starts as a gap on the shelf.</h1>
            <p className="fph-hero-sub">
              <strong>{TOTAL_FIGURES_LABEL} figures</strong> across <strong>{laneCount} fandoms</strong> &mdash; priced
              from <strong>real eBay solds</strong>, not hopeful asks.
            </p>

            <div className="fph-hero-search" id="search">
              <HeroSearch
                totalLabel={TOTAL_FIGURES_LABEL}
                placeholder="Search the guide — try &quot;Seth Rollins Ultimate Edition&quot;"
                placeholderExamples={receiptFigures.length ? receiptFigures.map(f => f.chipLabel) : undefined}
                showButton
              />
            </div>

            {/* Webaudit homepage-journey E2 (2026-07-10): the "New? Start
                here" chip renders unconditionally — it's the only cue a
                cold, no-search-term visitor gets, so it can't disappear
                along with the dynamic "Collectors are hunting" chips if
                receipt data ever fails to load at build. */}
            <div className="fph-hints">
              {receiptFigures.length >= 3 && (
                <>
                  <span>Collectors are hunting:</span>
                  {receiptFigures.slice(0, 3).map(f => (
                    <a className="fph-chip" href={f.href} key={f.fid}>{f.chipLabel}</a>
                  ))}
                </>
              )}
              <a className="fph-chip fph-chip-start" href="/guides/how-to-find-action-figure-values">New? Start here &rarr;</a>
            </div>
          </div>

          {shelf.length >= 6 && <ShelfCase figures={shelf} />}
        </div>
      </section>

      {/* ── ROOM I — GALLERY OF FANDOMS (was "Pick your lane"). Museum
          Night S3: top lanes/fandoms become large vitrine tiles pulling
          GENRE_TAXONOMY's line-level editorial data (badge/years/desc —
          computed at build, previously never rendered); the rest stay a
          compact floor directory. Every fandom keeps its real <a href>.
          "Lane" survives as the internal/CSS name (fph-lane-chip,
          laneCount, GENRE_TAXONOMY) — Steve flagged 2026-07-10 that
          "lane" alone reads as unexplained jargon to a visitor even
          though it's exactly a fandom (Wrestling, Star Wars, etc.); all
          USER-FACING copy says "fandom(s)" now, internal naming
          untouched (lower-risk, invisible to visitors). ── */}
      <section className="fph-gallery fph-seam" id="lines">
        <div className="wrap">
          <div className="fph-room-head" data-fph-reveal>
            <span className="fph-room-eyebrow">Room I</span>
            <h2 className="fph-guide-title">Gallery of fandoms</h2>
          </div>

          <div className="fph-vitrine-grid" data-fph-reveal data-fph-stagger>
            {featuredLanes.map(g => (
              <a
                className="fph-vitrine-tile"
                href={`/${g.slug}`}
                key={g.slug}
                style={{ '--accent': g.accent } as React.CSSProperties}
              >
                <div className="fph-vitrine-top">
                  <span className="fph-vitrine-name">{g.name}</span>
                  <span className="fph-vitrine-count">{g.totalCount}</span>
                </div>
                {g.lines.length > 0 && (
                  <div className="fph-vitrine-lines">
                    {g.lines.slice(0, 2).map(l => (
                      <div className="fph-vline" key={l.slug}>
                        {l.badge && <span className={`fph-vbadge ${l.badge}`}>{l.badge}</span>}
                        <span className="fph-vline-name">{l.name}</span>
                        {l.years && <span className="fph-vline-years">{l.years}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {g.lines[0]?.desc && <p className="fph-vitrine-desc">{g.lines[0].desc}</p>}
              </a>
            ))}
          </div>

          <div className="fph-floor-row" data-fph-reveal>
            <span className="fph-lane-kicker">More fandoms</span>
            {floorLanes.map(g => (
              <a className="fph-lane-chip" href={`/${g.slug}`} key={g.slug}>
                {g.name} <span className="ct">{g.totalCount}</span>
              </a>
            ))}
            <a className="fph-lane-chip all" href="/search">All {laneCount} fandoms &rarr;</a>
          </div>
        </div>
      </section>

      {/* AD STANDARD v2 HOME class, 1 unit -- after the first full content
          section below the hero (Room I gallery), never inside/above the
          hero. Steve's explicit monetize-GO, 2026-07-19 -- homepage was
          deliberately ZERO ads until this decision. */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '3rem 0' }}>
        <AdSlot slot="adsterra-banner" />
      </div>

      {/* ── ROOM II — WING GUIDE (was "Fastest price-guide paths"). Museum
          Night S3: the 6 guides render as book spines leaning against a
          shelf ledge at a fixed deterministic angle, straightening on
          hover/focus. Sheen reuses the existing fph-sweep keyframe via the
          shared .gallery-sheen class — no new sweep mechanism. ── */}
      <section className="fph-wing fph-seam" aria-label="Action figure price guide shortcuts">
        <div className="wrap">
          <div className="fph-guide-head" data-fph-reveal>
            <div>
              <span className="fph-room-eyebrow">Room II</span>
              <h2 className="fph-guide-title">Wing guide</h2>
              <p className="fph-guide-copy">
                Jump straight into the pages collectors search for when they need a sold-price answer.
              </p>
            </div>
            <a className="fph-guide-all" href="/guides">All collector guides &rarr;</a>
          </div>
          <div className="fph-spine-shelf" data-fph-reveal>
            {PRIORITY_GUIDES.map((guide, i) => (
              <a
                className="fph-spine"
                href={guide.href}
                key={guide.href}
                style={{
                  '--lean': `${SPINE_LEAN_DEG[i % SPINE_LEAN_DEG.length]}deg`,
                  '--sheen-delay': `${i * 1.3}s`,
                } as React.CSSProperties}
              >
                {guidePlates[i] ? (
                  <span className="fph-spine-plate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={guidePlates[i]!} alt="" width={56} height={56} loading="lazy" decoding="async" />
                  </span>
                ) : (
                  <span className="fph-spine-plate fph-spine-plate--fallback" aria-hidden>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1a1206" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" />
                    </svg>
                  </span>
                )}
                <span className="gallery-sheen" aria-hidden />
                <span className="fph-spine-kicker">{guide.kicker}</span>
                <span className="fph-spine-label">{guide.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROOM III — PROVENANCE WALL (was Sold Ticker + Recent Solds,
          merged). Museum Night S4, the de-Bloomberg core: zero ticker, zero
          autoplay, zero stamp animation — user-driven scroll is the
          mechanical difference that kills the ticker feeling. Curated 6-8
          wall (Steve's explicit density call, 2026-07-10) over an
          exhaustive feed. Every card is a real figure-page link. ── */}
      {provenanceFigures.length >= 4 && (
        <section className="fph-provenance fph-seam" aria-label="Provenance wall — recent real eBay sold prices">
          <GalleryTypeLayer text="PROVENANCE" />
          <div className="wrap">
            <div className="fph-room-head" data-fph-reveal>
              <span className="fph-room-eyebrow">Room III</span>
              <h2 className="fph-guide-title">Provenance wall</h2>
            </div>
          </div>
          <div className="fph-corridor-wrap" data-fph-reveal>
            <div className="fade-l" aria-hidden />
            <div className="fade-r" aria-hidden />
            <div className="fph-corridor">
              {provenanceFigures.map(f => <VitrineCard f={f} key={f.fid} />)}
            </div>
          </div>
          <div className="fph-corridor-dots" aria-hidden>
            {provenanceFigures.map(f => <span className="dot" key={f.fid} />)}
          </div>
          <div className="wrap">
            <p className="fph-provenance-foot">
              Every price here came from a completed eBay sale &mdash; never a hopeful listing.
            </p>
          </div>
        </section>
      )}

      {/* ── CLOSER ── */}
      <section className="fph-closer fph-seam" id="vault">
        <div className="wrap fph-closer-grid">
          <div data-fph-reveal>
            <h2>Pin it. Hunt it.<br />Hear when it moves.</h2>
            <p className="fph-closer-sub">
              A free account pins your shelf and your wantlist to real sold data &mdash;
              when a grail&apos;s comps move, you hear about it.
            </p>
            <div className="fph-closer-cta-row">
              <a className="fph-btn-gold" href="/sign-up">Start your free Vault</a>
              <a className="fph-btn-ghost" href="/methodology">How pricing works</a>
            </div>
          </div>
          {/* ── ROOM IV — VAULT ENTRANCE (closer). Museum Night S4: the
              ledger's spot now closes on ONE flagship pick — "pin this one
              first"; left column (CTA) untouched per spec. Vitrine
              Showstopper (2026-07-23, approved design 441e2cb9): when the
              pick has a photo it renders as the spotlight-reveal case
              (SpotlightVitrine) — scroll-triggered light-up next to the
              sign-up CTA; photo-less picks keep the flat VitrineCard. ── */}
          {closerPick && (
            <div className="fph-closer-pick" data-fph-reveal>
              <span className="fph-room-eyebrow">Pin this one first</span>
              {closerPick.image
                ? <SpotlightVitrine f={closerPick} />
                : <VitrineCard f={closerPick} large />}
            </div>
          )}
        </div>
      </section>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </main>
  )
}
