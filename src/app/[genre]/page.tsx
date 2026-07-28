import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { prettyFigureUrl, figureUrl, type KBFigure } from '@/data/kb'
import { figuresForGenre, groupAndSortLines, cardName, genreSlugForFandom, getFandom } from '@/lib/genreFigures'
import { GENRE_TAXONOMY, type LineTile } from '@/data/genre-lines'
import { prettifySlug, buildEbaySearchUrl, EBAY_CAMPAIGN_ID } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { thumb } from '@/lib/imageUrl'
import AdSlot from '@/app/components/AdSlot'
import TrackedLink from '@/app/components/TrackedLink'
import HeroSearch from '@/app/components/HeroSearch'
import FigureThumb from '@/app/components/FigureThumb'
import ShelfCase, { type ShelfFigure } from '@/app/components/ShelfCase'
import ScrollReveal from '@/app/components/ScrollReveal'
import SiteHeader from '@/app/components/SiteHeader'
import BreadcrumbJsonLd from '@/app/_components/BreadcrumbJsonLd'
import JsonLd from '@/app/_components/JsonLd'

// ── Genre config (SEO copy only — visuals are the shared shelf design) ───────

const GENRE_META: Record<string, { label: string; title: string; description: string }> = {
  'wrestling': {
    label: 'Wrestling',
    title: 'WWE & Wrestling Figure Price Guide — Mattel Elite, Hasbro & More',
    description: 'WWE, AEW, and wrestling action figure price guide. Real eBay sold prices for Mattel Elite, Hasbro WWF, Jakks Ruthless Aggression, and 5,000+ figures. Updated daily.',
  },
  'marvel': {
    label: 'Marvel',
    title: 'Marvel Legends Price Guide — Hasbro, ToyBiz & More',
    description: 'Marvel Legends price guide with real eBay sold prices. Track Hasbro Marvel Legends, ToyBiz, and Marvel action figure values across your collection. Updated daily.',
  },
  'star-wars': {
    label: 'Star Wars',
    title: 'Star Wars Action Figure Price Guide — Black Series, Vintage Collection & More',
    description: 'Star Wars action figure price guide. Real eBay sold prices for Black Series, Vintage Collection, Power of the Force, and more. Updated daily.',
  },
  'dc': {
    label: 'DC',
    title: 'DC Action Figure Price Guide — McFarlane, DC Direct & More',
    description: 'DC action figure price guide. Real eBay sold prices for McFarlane DC Multiverse, DC Direct, and DC Universe Classics figures. Updated daily.',
  },
  'transformers': {
    label: 'Transformers',
    title: 'Transformers Figure Price Guide — Masterpiece, Studio Series & More',
    description: 'Transformers action figure price guide. Real eBay sold prices for Masterpiece, Studio Series, and Generations figures. Updated daily.',
  },
  'gijoe': {
    label: 'G.I. Joe',
    title: 'G.I. Joe Figure Price Guide — Classified Series & Vintage',
    description: 'G.I. Joe action figure price guide. Real eBay sold prices for Classified Series and vintage A Real American Hero figures. Updated daily.',
  },
  'masters-of-the-universe': {
    label: 'Masters of the Universe',
    title: 'Masters of the Universe Price Guide — MOTU Origins, Masterverse & Vintage',
    description: 'Masters of the Universe (MOTU) price guide. Real eBay sold prices for Origins, Masterverse, and vintage 1982 Mattel figures. Updated daily.',
  },
  'teenage-mutant-ninja-turtles': {
    label: 'TMNT',
    title: 'TMNT Figure Price Guide — NECA, Playmates & Super7',
    description: 'Teenage Mutant Ninja Turtles action figure price guide. Real eBay sold prices for NECA, Playmates vintage, and Super7 TMNT figures. Updated daily.',
  },
  'power-rangers': {
    label: 'Power Rangers',
    title: 'Power Rangers Figure Price Guide — Lightning Collection & Vintage',
    description: 'Power Rangers action figure price guide. Real eBay sold prices for Lightning Collection and vintage Power Rangers figures. Updated daily.',
  },
  'indiana-jones': {
    label: 'Indiana Jones',
    title: 'Indiana Jones Figure Price Guide — Adventure Series & Vintage Kenner',
    description: 'Indiana Jones action figure price guide. Real eBay sold prices for Adventure Series and vintage Kenner figures. Updated daily.',
  },
  'ghostbusters': {
    label: 'Ghostbusters',
    title: 'Ghostbusters Figure Price Guide — Plasma Series & Vintage Kenner',
    description: 'Ghostbusters action figure price guide. Real eBay sold prices for Plasma Series and vintage Kenner Real Ghostbusters figures. Updated daily.',
  },
  'mythic-legions': {
    label: 'Mythic Legions',
    title: 'Mythic Legions Price Guide — Four Horsemen Figures',
    description: 'Mythic Legions price guide. Real eBay sold prices for Four Horsemen figures from all waves. Updated daily.',
  },
  'thundercats': {
    label: 'Thundercats',
    title: 'Thundercats Figure Price Guide — Super7 & LJN Vintage',
    description: 'Thundercats action figure price guide. Real eBay sold prices for Super7 Ultimates and vintage LJN Thundercats figures. Updated daily.',
  },
  'action-force': {
    label: 'Action Force',
    title: 'Action Force Figure Price Guide',
    description: 'Action Force action figure price guide. Real eBay sold prices updated daily.',
  },
  'dungeons-dragons': {
    label: 'Dungeons & Dragons',
    title: 'Dungeons & Dragons Figure Price Guide — Golden Archive & Vintage',
    description: 'Dungeons & Dragons action figure price guide. Real eBay sold prices for Golden Archive and vintage D&D figures. Updated daily.',
  },
  'neca': {
    label: 'Horror & Film',
    title: 'NECA Horror & Film Figure Price Guide — Ultimate Series & More',
    description: 'NECA Horror & Film action figure price guide. Real eBay sold prices for Ultimate figures, slashers, and movie characters. Updated daily.',
  },
  'spawn': {
    label: 'Spawn',
    title: 'Spawn Figure Price Guide — McFarlane Toys Series 1–40',
    description: 'Spawn action figure price guide. Real eBay sold prices for McFarlane Toys Spawn series from Series 1 through modern releases. Updated daily.',
  },
}

// force-static is the load-bearing half of this pair on a dynamic segment
// (2026-07-27, hub-ISR root cause): without generateStaticParams or
// `dynamic = 'force-static'`, Next never registers the route in the
// prerender-manifest, OpenNext's cache interceptor gates ISR purely on
// manifest membership, and every request falls through to full SSR with
// `private, no-cache, no-store` — `revalidate` alone is silently inert.
// Option E (below) removed GSP and carried over only the revalidate half, so
// every genre and line hub served uncached SSR from 6/14 to now. Same pattern
// as [line]/[slug]/page.tsx, in production since bc7d221. Build-heap safety
// (the reason GSP was removed) re-verified on a disposable checkout
// 2026-07-27: 139/139 pages, default heap, no OOM — force-static does not
// enumerate genres at build time, so the OOM multiplier never returns.
export const dynamic = 'force-static'
export const revalidate = 3600

// On-demand ISR (no generateStaticParams) — Option E (2026-06-14). Prerendering
// all 17 genres at build instantiated the full ~22k-figure KB array once PER
// genre worker (figuresForGenre → getFiguresByFandom) — the multiplier behind the
// build-heap OOM. Without GSP these render on first request (invalid genres are
// caught by the GENRE_META guard in the page body) and cache via `revalidate`,
// the same on-demand pattern the figure pages already use. dynamicParams
// defaults to true. See Bridge/WEB-OPTION-E-MIGRATION-RUNBOOK-2026-06-14.md.

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string }> }
): Promise<Metadata> {
  const { genre } = await params

  // Genre-alias 308 (2026-07-12 root-cause FIX-2): /marvel-comics → /marvel,
  // /gi-joe → /gijoe, /tmnt → /teenage-mutant-ninja-turtles. These aliases
  // 404'd (no GENRE_META entry) while thousands of pages canonicaled into
  // them. In generateMetadata for a real pre-streaming 308.
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}`)

  const meta = GENRE_META[genre]
  if (!meta) return { robots: { index: false, follow: false } }

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://figurepinner.com/${genre}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://figurepinner.com/${genre}`,
    },
  }
}

// ── Data assembly (all computed from the KB at build — drift-proof) ──────────

/** KB catch-all buckets that shouldn't headline the registry. They still get
 *  a row in the "more lines" list so everything stays reachable. */
const CATCH_ALL_LINES = new Set(['general', 'misc', 'unknown'])
const REGISTRY_ROWS = 10
const CHARACTER_ROWS = 12

type RegistryRow = {
  slug: string
  name: string
  maker: string | null
  years: string
  count: number
  thumbs: string[]
}

type MoreLine = { slug: string; name: string; count: number }

type CharacterHighlight = {
  slug: string
  name: string
  count: number
  image: string | null
  href: string
}

/** Top characters in a genre by release count (Phase 2 session 3 — the
 *  genre hub's own inbound link to /[genre]/character/[slug], which
 *  Phase 2 session 1 left orphaned from every template except line pages.
 *  Render-only from the already-loaded figures array — no new fetches,
 *  same ISR-safe shape as session 1's rail link + breadcrumb.
 *
 *  P2S3 fix: link via the character's DOMINANT fandom
 *  (genreSlugForFandom), not the route's raw genre param. On non-rollup
 *  genres these are identical (a no-op). On the NECA rollup, the route
 *  param is 'neca' but the character hub's real canonical + the sitemap
 *  both key off the figure's own fandom slug (horror/terminator/…) — the
 *  same trap [genre]/[line]/page.tsx's FigureCard chip already had to
 *  dodge for P2S1. Linking the raw route param here would mint a second,
 *  self-canonicalizing URL variant for every NECA character. Count is
 *  recomputed within the dominant fandom too, so the card matches what
 *  the linked page actually shows. */
function buildCharacterHighlights(figures: KBFigure[]): CharacterHighlight[] {
  const groups = new Map<string, KBFigure[]>()
  for (const f of figures) {
    if (!groups.has(f.character_canonical)) groups.set(f.character_canonical, [])
    groups.get(f.character_canonical)!.push(f)
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, CHARACTER_ROWS)
    .map(([slug, group]) => {
      const byFandom = new Map<string, KBFigure[]>()
      for (const f of group) {
        if (!byFandom.has(f.fandom)) byFandom.set(f.fandom, [])
        byFandom.get(f.fandom)!.push(f)
      }
      const [dominantFandom, dominantGroup] =
        [...byFandom.entries()].sort((a, b) => b[1].length - a[1].length)[0]

      return {
        slug,
        name: prettifySlug(slug),
        count: dominantGroup.length,
        image:
          dominantGroup.find(f => f.canonical_image_url)?.canonical_image_url ??
          group.find(f => f.canonical_image_url)?.canonical_image_url ??
          null,
        href: `/${genreSlugForFandom(dominantFandom)}/character/${slug}`,
      }
    })
}

function buildHub(genre: string, figures: KBFigure[]) {
  const groups = groupAndSortLines(figures)

  // Editorial overlay (names that deserve better casing + era labels) — same
  // validated source the homepage taxonomy uses. Keyed by product_line slug.
  const tab = GENRE_TAXONOMY.find(t => t.slug === genre)
  const editorial = new Map<string, LineTile>((tab?.lines ?? []).map(l => [l.slug, l]))

  const headline = groups.filter(([slug]) => !CATCH_ALL_LINES.has(slug))
  const top = headline.slice(0, REGISTRY_ROWS)
  const topSlugs = new Set(top.map(([slug]) => slug))

  const registry: RegistryRow[] = top.map(([slug, group]) => {
    const ed = editorial.get(slug)
    const name = ed?.name ?? prettifySlug(slug)

    // Dominant manufacturer for the line; hidden when the line name already
    // carries it (e.g. "WCW Toy Biz").
    const byMfr = new Map<string, number>()
    for (const f of group) byMfr.set(f.manufacturer, (byMfr.get(f.manufacturer) ?? 0) + 1)
    const topMfr = [...byMfr.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const makerName = topMfr ? prettifySlug(topMfr) : null
    const maker = makerName && !name.toLowerCase().includes(makerName.toLowerCase().split(' ')[0])
      ? makerName
      : null

    const thumbs: string[] = []
    for (const f of group) {
      if (thumbs.length >= 4) break
      if (!f.canonical_image_url) continue
      const t = thumb(f.canonical_image_url, 96)
      if (t) thumbs.push(t)
    }

    return { slug, name, maker, years: ed?.years ?? '', count: group.length, thumbs }
  })

  const more: MoreLine[] = groups
    .filter(([slug]) => !topSlugs.has(slug))
    .map(([slug, group]) => ({ slug, name: prettifySlug(slug), count: group.length }))

  // The case: one representative figure per top line (newest wave with a
  // photo), two shelves of five. Entries without an image are skipped, so
  // the case can never ship broken mounts.
  const shelf: ShelfFigure[] = []
  for (const [slug, group] of headline) {
    if (shelf.length >= 10) break
    const lineName = editorial.get(slug)?.name ?? prettifySlug(slug)
    const f = group.find(g => g.canonical_image_url)
    if (!f) continue
    shelf.push({
      fid: f.figure_id,
      href: prettyFigureUrl(f),
      name: cardName(f),
      tag: lineName,
      img: thumb(f.canonical_image_url!, 225) ?? f.canonical_image_url!,
    })
  }
  // Thin genres: top up with a second figure per deep line.
  if (shelf.length < 10) {
    const have = new Set(shelf.map(s => s.fid))
    for (const [slug, group] of headline) {
      if (shelf.length >= 10) break
      const lineName = editorial.get(slug)?.name ?? prettifySlug(slug)
      for (const f of group) {
        if (shelf.length >= 10) break
        if (!f.canonical_image_url || have.has(f.figure_id)) continue
        have.add(f.figure_id)
        shelf.push({
          fid: f.figure_id,
          href: prettyFigureUrl(f),
          name: cardName(f),
          tag: lineName,
          img: thumb(f.canonical_image_url, 225) ?? f.canonical_image_url,
        })
      }
    }
  }

  return { groups, registry, more, shelf, totalLines: groups.length }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GenrePage(
  { params }: { params: Promise<{ genre: string }> }
) {
  const { genre } = await params

  // Genre-alias 308 fallback (real 308 comes from generateMetadata above).
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}`)

  const meta = GENRE_META[genre]
  if (!meta) notFound()

  const figures = figuresForGenre(genre)
  if (!figures.length) notFound()

  const { groups, registry, more, shelf, totalLines } = buildHub(genre, figures)
  const characters = buildCharacterHighlights(figures)
  const totalFigures = figures.length
  const hunting = shelf.slice(0, 3)
  const aisle = meta.label.toLowerCase()
  const ebayHref = buildEbaySearchUrl('', `${meta.label} action figures`, '', '', null, EBAY_CAMPAIGN_ID)

  // JSON-LD structured data (unchanged from the pre-port page — figure URLs
  // from the five deepest lines).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${meta.label} Action Figure Price Guide`,
    description: meta.description,
    url: `https://figurepinner.com/${genre}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `${meta.label} Action Figure Prices`,
      numberOfItems: totalFigures,
      itemListElement: groups.slice(0, 5).flatMap(([, group]) =>
        group.slice(0, 10).map((f, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://figurepinner.com${prettyFigureUrl(f)}`,
          name: cardName(f),
        }))
      ),
    },
  }

  return (
    <div className="fph fpg">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd crumbs={[
        { name: 'Home', url: 'https://figurepinner.com' },
        { name: meta.label, url: `https://figurepinner.com/${genre}` },
      ]} />
      <style>{`
        .fph {
          --fph-cream: #f2e8d5;
          --fph-cream-dim: rgba(242,232,213,.60);
          --fph-cream-mut: rgba(242,232,213,.38);
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

        /* ── masthead ── */
        .fpg-mast {
          position: relative; padding: 32px 0 44px; overflow: hidden;
          background:
            radial-gradient(900px 520px at 80% -10%, rgba(224,168,62,.085), transparent 64%),
            radial-gradient(640px 460px at -8% 100%, rgba(0,102,255,.05), transparent 60%),
            #09090f;
        }
        .fpg-mast-grid { display: grid; grid-template-columns: 1fr 1.06fr; gap: 60px; align-items: center; }
        .fpg-mast-grid > * { min-width: 0; }
        .fpg-eyebrow {
          font-size: 12px; font-weight: 500; letter-spacing: .24em; text-transform: uppercase;
          color: var(--fph-gold); display: inline-flex; align-items: center; gap: 11px;
        }
        .fpg-eyebrow::before { content: ''; width: 30px; height: 1px; background: var(--fph-gold); opacity: .65; }
        .fpg h1 {
          margin: 10px 0 0; font-family: var(--fp-font-display); font-weight: 400;
          font-size: clamp(56px, 7vw, 100px); line-height: .92; letter-spacing: .015em;
          color: #EEEEF5; text-wrap: balance;
        }
        .fpg-mast-sub { margin-top: 18px; max-width: 500px; font-size: 16.5px; line-height: 1.7; font-weight: 300; color: var(--fph-cream-dim); }
        .fpg-mast-sub strong { color: var(--fph-cream); font-weight: 500; }
        .fpg-mast-search { margin-top: 26px; max-width: 500px; }
        .fpg-mast-search button {
          background: linear-gradient(180deg, #f5c462, #e0a83e) !important;
          color: #1a1206 !important;
        }
        /* 2026-07-26: the search box owns its own surface + animated focus
           ring now (.fp-search-panel / .fp-search-ring, globals.css). An
           opaque background here would cover that panel, and the old faint
           :focus shadow is superseded by the ring — keeping it just drew a
           second, much weaker gold edge inside the new one. */
        .fpg-mast-search input {
          background: transparent !important;
        }
        .fpg-hints { margin-top: 13px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .fpg-hints span { font-size: 11.5px; font-weight: 300; color: var(--fph-cream-mut); margin-right: 2px; letter-spacing: .02em; }
        .fpg-chip {
          font-size: 11.5px; font-weight: 400; letter-spacing: .03em; color: var(--fph-cream-dim);
          border: 1px solid rgba(242,232,213,.12); border-radius: 99px;
          padding: 4px 12px; text-decoration: none;
          transition: color .2s, border-color .2s, background .2s;
        }
        .fpg-chip:hover { color: var(--fph-gold-hi); border-color: rgba(224,168,62,.45); background: rgba(224,168,62,.05); }

        /* ── the case (markup in ShelfCase — same skin as the homepage) ── */
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
          animation: fph-driftX 12s ease-in-out infinite alternate;
        }
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
          color: rgba(242,232,213,.36);
        }
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
        .fph-mount img { width: 100%; aspect-ratio: 4/4.4; object-fit: cover; border-radius: 3px; background: #e9e0cd; display: block; }
        .fph-fig:hover .fph-mount { transform: translateY(-9px) rotate(-1.4deg); box-shadow: 0 24px 34px rgba(0,0,0,.55), 0 0 0 1px rgba(224,168,62,.5), 0 0 24px rgba(224,168,62,.16); }
        .fph-fig.pinned .fph-mount { box-shadow: 0 10px 18px rgba(0,0,0,.42), 0 0 0 1px var(--fph-gold), 0 0 20px rgba(224,168,62,.24); }
        .fph-fig.demo .fph-mount { transform: translateY(-6px); }
        .fph-fig.demo .fph-mount::after { opacity: 1; }
        .fph-fig-name { margin-top: 9px; font-size: 11.5px; font-weight: 500; color: var(--fph-cream); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-fig-tag { margin-top: 2px; font-size: 9.5px; font-weight: 400; letter-spacing: .11em; text-transform: uppercase; color: var(--fph-cream-mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-fig-tag.sold { color: var(--fph-gold-hi); }
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

        /* ── the line registry ── */
        .fpg-registry {
          padding: 34px 0 40px;
          background:
            radial-gradient(700px 380px at 88% 0%, rgba(224,168,62,.045), transparent 62%),
            #09090f;
        }
        .fpg-reg-head { display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap; margin-bottom: 14px; }
        .fpg-kicker {
          font-size: 11px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;
          color: var(--fph-gold); display: inline-flex; align-items: center; gap: 12px;
        }
        .fpg-kicker::before { content: ''; width: 34px; height: 1px; background: linear-gradient(90deg, transparent, var(--fph-gold)); opacity: .7; }
        .fpg h2 {
          margin: 0; font-family: var(--fp-font-display); font-weight: 400;
          font-size: clamp(30px, 3.2vw, 40px); line-height: 1; letter-spacing: .015em; color: #EEEEF5;
        }
        .fpg-reg-sub { font-size: 13px; font-weight: 300; color: var(--fph-cream-mut); }
        .fpg-reg { border-top: 1px solid var(--fph-line); }
        .fpg-reg-row {
          position: relative; display: flex; align-items: center; gap: 18px;
          padding: 10px 10px 10px 14px; border-bottom: 1px solid var(--fph-line);
          text-decoration: none; color: inherit;
        }
        .fpg-reg-row::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(90deg, rgba(224,168,62,.05), transparent 70%);
          opacity: 0; transition: opacity .25s;
        }
        .fpg-reg-row:hover::after { opacity: 1; }
        .fpg-reg-row .edge {
          position: absolute; left: 0; top: 50%; width: 2px; height: 0;
          transform: translateY(-50%);
          background: linear-gradient(180deg, var(--fph-gold-hi), var(--fph-gold));
          border-radius: 1px; box-shadow: 0 0 8px rgba(224,168,62,.5);
          transition: height .3s cubic-bezier(.22,.61,.36,1);
        }
        .fpg-reg-row:hover .edge { height: 58%; }
        .fpg-reg-who { flex: 0 0 250px; min-width: 0; }
        .fpg-reg-name {
          display: block; font-family: var(--fp-font-display); font-size: 25px; font-weight: 400;
          letter-spacing: .03em; color: var(--fph-cream); line-height: 1.05;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color .2s;
        }
        .fpg-reg-row:hover .fpg-reg-name { color: var(--fph-gold-hi); }
        .fpg-reg-maker {
          display: block; margin-top: 2px; font-size: 9.5px; font-weight: 400;
          letter-spacing: .14em; text-transform: uppercase;
          color: var(--fph-cream-mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .fpg-reg-meta {
          flex: 0 0 auto; font-size: 12px; font-weight: 400; letter-spacing: .05em;
          color: var(--fph-gold-mut); font-variant-numeric: tabular-nums; white-space: nowrap;
        }
        .fpg-reg-meta .dot { color: rgba(224,168,62,.35); margin: 0 7px; }
        .fpg-reg-lead { flex: 1 1 auto; min-width: 18px; border-bottom: 1px dotted rgba(242,232,213,.14); transform: translateY(2px); }
        .fpg-reg-thumbs { flex: 0 0 auto; display: flex; gap: 7px; }
        .fpg-reg-thumbs img {
          width: 38px; height: 38px; border-radius: 5px; object-fit: cover;
          background: #e9e0cd; border: 1px solid rgba(242,232,213,.10);
          transition: transform .3s cubic-bezier(.22,.61,.36,1), border-color .3s;
        }
        .fpg-reg-row:hover .fpg-reg-thumbs img { border-color: rgba(224,168,62,.4); transform: translateY(-2px); }
        .fpg-reg-row:hover .fpg-reg-thumbs img:nth-child(2) { transition-delay: .04s; }
        .fpg-reg-row:hover .fpg-reg-thumbs img:nth-child(3) { transition-delay: .08s; }
        .fpg-reg-row:hover .fpg-reg-thumbs img:nth-child(4) { transition-delay: .12s; }
        .fpg-reg-chev {
          flex: 0 0 auto; width: 22px; height: 22px; color: var(--fph-cream-mut);
          transition: color .25s, transform .3s cubic-bezier(.22,.61,.36,1);
        }
        .fpg-reg-row:hover .fpg-reg-chev { color: var(--fph-gold-hi); transform: translateX(4px); }

        /* ── shop by character (Phase 2 session 3) ── */
        .fpg-chars { padding: 6px 0 8px; }
        .fpg-char-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
        .fpg-char-card {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px; border: 1px solid var(--fph-line);
          background: rgba(242,232,213,.014); text-decoration: none; color: inherit;
          transition: border-color .2s, background .2s, transform .25s cubic-bezier(.22,.61,.36,1);
        }
        .fpg-char-card:hover { border-color: rgba(224,168,62,.4); background: rgba(224,168,62,.05); transform: translateY(-2px); }
        .fpg-char-text { min-width: 0; }
        .fpg-char-name { display: block; font-size: 13px; font-weight: 500; color: var(--fph-cream); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fpg-char-count { display: block; margin-top: 1px; font-size: 10.5px; color: var(--fph-gold-mut); }

        /* ── more lines (everything beyond the top rows stays reachable) ── */
        .fpg-more { margin-top: 26px; }
        .fpg-more-head {
          font-size: 11px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;
          color: var(--fph-cream-mut); margin-bottom: 12px;
        }
        .fpg-more-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .fpg-more-chip {
          display: inline-flex; align-items: baseline; gap: 7px;
          font-size: 11.5px; font-weight: 400; letter-spacing: .03em; color: var(--fph-cream-dim);
          border: 1px solid rgba(242,232,213,.10); border-radius: 99px;
          padding: 5px 13px; text-decoration: none; line-height: 1.2;
          transition: color .2s, border-color .2s, background .2s;
        }
        .fpg-more-chip .ct { font-size: 10px; color: var(--fph-gold-mut); }
        .fpg-more-chip:hover { color: var(--fph-gold-hi); border-color: rgba(224,168,62,.45); background: rgba(224,168,62,.05); }

        /* ── ad ── */
        .fpg-ad { display: flex; justify-content: center; padding: 26px 32px 0; }

        /* ── closer ── */
        .fpg-closer {
          padding: 34px 0 38px;
          background:
            radial-gradient(700px 360px at 14% 0%, rgba(224,168,62,.05), transparent 60%),
            radial-gradient(600px 360px at 92% 100%, rgba(224,168,62,.03), transparent 60%);
        }
        .fpg-closer-in { display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
        .fpg-closer-copy {
          margin: 0; font-family: var(--fp-font-display); font-weight: 400;
          font-size: clamp(26px, 2.9vw, 36px); line-height: 1.06; letter-spacing: .015em;
          max-width: 620px; text-wrap: balance; color: #EEEEF5;
        }
        .fpg-closer-copy em { font-style: normal; color: var(--fph-gold); }
        .fpg-btn-gold {
          display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto;
          font-size: 14px; font-weight: 500; letter-spacing: .04em;
          color: #1a1206; background: linear-gradient(180deg, var(--fph-gold-hi), var(--fph-gold));
          padding: 12px 27px; border-radius: 99px; text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 1px 0 rgba(255,255,255,.22) inset, 0 4px 14px rgba(224,168,62,.16);
          transition: transform .2s, box-shadow .2s;
        }
        .fpg-btn-gold:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(255,255,255,.22) inset, 0 8px 20px rgba(224,168,62,.28); }
        .fpg-closer-actions { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 0 0 auto; }
        .fpg-closer-ebay {
          font-size: 13px; font-weight: 600; letter-spacing: .02em;
          color: var(--fph-gold); text-decoration: none;
          border-bottom: 1px solid rgba(224,168,62,.33);
        }

        /* ── reduced motion: freeze to a good static state ── */
        @media (prefers-reduced-motion: reduce) {
          [data-fph-reveal] { opacity: 1; transform: none; transition: none; }
          .fph-fig { animation: none !important; }
          .fph-fig:hover .fph-mount { transform: none; transition: none; }
          .fph-case-light, .fph-case-sweep { display: none; }
          .fph-case::before { display: none; }
          .fph-tray-thumbs img { animation: none !important; }
          .fph-fly-thumb { display: none; }
          .fpg-char-card:hover { transform: none; }
        }

        /* ── responsive ── */
        @media (max-width: 1020px) {
          .fpg-mast-grid { grid-template-columns: 1fr; gap: 46px; }
          .fpg-mast-sub, .fpg-mast-search { max-width: 640px; }
          .fpg-reg-who { flex: 0 0 210px; }
          .fpg-reg-lead { display: none; }
          .fpg-reg-meta { margin-left: auto; }
        }
        @media (max-width: 640px) {
          .fph .wrap { padding: 0 20px; }
          .fpg-mast { padding: 28px 0 40px; }
          .fph-case { padding: 34px 14px 20px; }
          .fph-case-label { left: 18px; }
          .fph-shelf { padding: 0 2px 14px; }
          .fph-shelf-row { overflow-x: auto; scrollbar-width: none; padding-top: 14px; margin-top: -14px; }
          .fph-shelf-row::-webkit-scrollbar { display: none; }
          .fph-fig { flex: 0 0 104px; }
          .fph-tray { flex-wrap: wrap; border-radius: 16px; }
          .fph-tray-cta { margin-left: 0; }
          .fpg-registry { padding: 30px 0 36px; }
          .fpg-reg-row { flex-wrap: wrap; gap: 8px 12px; padding: 13px 6px 14px 12px; }
          .fpg-reg-who { flex: 1 1 auto; order: 1; }
          .fpg-reg-chev { order: 2; }
          .fpg-reg-meta { order: 3; flex: 1 1 100%; margin-left: 0; }
          .fpg-reg-thumbs { order: 4; flex: 1 1 100%; }
          .fpg-reg-thumbs img { width: 40px; height: 40px; }
          .fpg-char-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
          .fpg-closer { padding: 32px 0 36px; }
        }
      `}</style>

      <SiteHeader crumbs={[{ label: meta.label }]} />
      <ScrollReveal />

      {/* ── MASTHEAD ── */}
      <section className="fpg-mast">
        <div className="wrap fpg-mast-grid">
          <div>
            <span className="fpg-eyebrow">The {aisle} aisle</span>
            <h1>{meta.label}</h1>
            <p className="fpg-mast-sub">
              <strong>{totalFigures.toLocaleString()} figures</strong> across{' '}
              <strong>{totalLines} lines</strong> &mdash; every era of the aisle
              under one light, priced from real eBay solds.
            </p>

            <div className="fpg-mast-search">
              <HeroSearch
                placeholder={`Search ${meta.label} figures`}
                placeholderExamples={hunting.length ? hunting.map(h => h.name) : undefined}
                showButton
              />
            </div>

            {hunting.length >= 3 && (
              <div className="fpg-hints">
                <span>Collectors are hunting:</span>
                {hunting.map(h => (
                  <a className="fpg-chip" href={h.href} key={h.fid}>{h.name}</a>
                ))}
              </div>
            )}
          </div>

          {shelf.length >= 6 && (
            <div data-fph-reveal>
              <ShelfCase figures={shelf} label={`The ${aisle} case — tap a pin to keep one`} />
            </div>
          )}
        </div>
      </section>

      {/* ── THE LINE REGISTRY ── */}
      <section className="fpg-registry fph-seam" id="registry">
        <div className="wrap">
          <div className="fpg-reg-head" data-fph-reveal>
            <span className="fpg-kicker">The line registry</span>
            <h2>Pick your era</h2>
            <span className="fpg-reg-sub">
              {registry.length < totalLines
                ? `The ${registry.length} deepest lines`
                : registry.length === 1 ? 'The line' : `All ${registry.length} lines`}
              {' '}&mdash; counts live from the guide
            </span>
          </div>

          <div className="fpg-reg">
            {registry.map((r, i) => (
              <a
                className="fpg-reg-row"
                data-fph-reveal
                style={{ transitionDelay: `${(i % 5) * 0.05}s` }}
                href={`/${genre}/${r.slug}`}
                key={r.slug}
              >
                <span className="edge" aria-hidden />
                <span className="fpg-reg-who">
                  <span className="fpg-reg-name">{r.name}</span>
                  {r.maker && <span className="fpg-reg-maker">{r.maker}</span>}
                </span>
                <span className="fpg-reg-meta">
                  {r.years && <>{r.years}<span className="dot">&middot;</span></>}
                  {r.count.toLocaleString()} figures
                </span>
                <span className="fpg-reg-lead" aria-hidden />
                {r.thumbs.length > 0 && (
                  <span className="fpg-reg-thumbs" aria-hidden>
                    {r.thumbs.map((t, ti) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t} alt="" loading="lazy" key={ti} />
                    ))}
                  </span>
                )}
                <svg className="fpg-reg-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
              </a>
            ))}
          </div>

          {more.length > 0 && (
            <div className="fpg-more" data-fph-reveal>
              <div className="fpg-more-head">
                {more.length} more {more.length === 1 ? 'line' : 'lines'} &mdash; all {totalLines} in the aisle
              </div>
              <div className="fpg-more-grid">
                {more.map(l => (
                  <a className="fpg-more-chip" href={`/${genre}/${l.slug}`} key={l.slug}>
                    {l.name} <span className="ct">{l.count.toLocaleString()}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {characters.length >= 4 && (
          <div className="fpg-chars" data-fph-reveal>
            <div className="fpg-reg-head">
              <span className="fpg-kicker">Shop by character</span>
              <h2>Find your favorite</h2>
              <span className="fpg-reg-sub">Top {characters.length} by figure count</span>
            </div>
            <div className="fpg-char-grid">
              {characters.map(c => (
                <a className="fpg-char-card" href={c.href} key={c.slug}>
                  <FigureThumb
                    image={c.image}
                    size={40}
                    radius={8}
                    cdnWidth={96}
                    fallback={{ kind: 'icon', accent: '#e0a83e' }}
                  />
                  <span className="fpg-char-text">
                    <span className="fpg-char-name">{c.name}</span>
                    <span className="fpg-char-count">{c.count.toLocaleString()} figure{c.count !== 1 ? 's' : ''}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* AD STANDARD v2: GRID class, 1 unit, after the last content grid,
          before the closer. Was a dead AdSense leaderboard call in the same
          position — swapped to the live Adsterra key, no position change. */}
      <div className="fpg-ad">
        <AdSlot slot="adsterra-banner" />
      </div>

      {/* ── CLOSER ── */}
      <section className="fpg-closer fph-seam" id="vault">
        <div className="wrap fpg-closer-in" data-fph-reveal>
          <p className="fpg-closer-copy">
            Pin the ones you&apos;re hunting &mdash; <em>a free Vault</em> keeps
            your {aisle} shelf and hears when a grail moves.
          </p>
          <div className="fpg-closer-actions">
            <a className="fpg-btn-gold" href="/sign-up">Start your free Vault</a>
            <TrackedLink
              href={ebayHref}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              funnelEvent="ebay_exit"
              funnelDetail={{ target: 'genre_hub_cta', genre }}
              className="fpg-closer-ebay"
            >
              Hunt {meta.label} on eBay →
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}
