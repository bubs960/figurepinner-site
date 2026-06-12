import type { Metadata } from 'next'
import HeroSearch from './components/HeroSearch'
import ShelfCase, { type ShelfFigure } from './components/ShelfCase'
import ScrollReveal from './components/ScrollReveal'
import SiteHeader from './components/SiteHeader'
import { fetchHomeMarket, type TapeItem } from './_lib/homeReceipt'
import { TOTAL_FIGURES_LABEL } from '@/data/kb-stats'
import { GENRE_TAXONOMY } from '@/data/genre-lines'
import { getFigureById, figureUrl } from '@/data/kb'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { thumb } from '@/lib/imageUrl'

export const metadata: Metadata = {
  title: { absolute: 'FigurePinner - Action Figure Price Guide' },
  description: `Real sold-price data for ${TOTAL_FIGURES_LABEL} action figures. Know what any figure is worth before you bid, buy, or sell.`,
  alternates: { canonical: 'https://figurepinner.com' },
}

// ── The shelf — curated, KB-resolved (entries that stop resolving or lose
//    their image are dropped at build, never shipped broken) ────────────────────
const SHELF_FIDS: Array<{ fid: string; tag: string }> = [
  // row 1 — wrestling (deepest lane)
  { fid: 'fp_wrestling_mattel_ultimate-edition_30_seth-rollins_6dfa66', tag: 'Ultimate Ed. 30' },
  { fid: 'fp_wrestling_mattel_elite_112_becky-lynch_3d7e12', tag: 'Elite 112' },
  { fid: 'fp_wrestling_mattel_elite_100_the-rock_3c447b', tag: 'Elite 100' },
  { fid: 'fp_wrestling_mattel_ultimate-edition_25_cody-rhodes_83188e', tag: 'Ultimate Ed. 25' },
  { fid: 'fp_wrestling_mattel_elite_116_jade-cargill_dd785b', tag: 'Elite 116' },
  { fid: 'fp_wrestling_mattel_ultimate-edition_tgt_rey-mysterio_09717a', tag: 'Ultimate Edition' },
  // row 2 — across the lanes
  { fid: 'fp_star-wars_hasbro_black-series_galaxy_darth-vader_be6b6f', tag: 'Black Series' },
  { fid: 'fp_star-wars_hasbro_black-series_blue-wave-2014-2015_obi-wan-kenobi_4deda7', tag: 'Black Series' },
  { fid: 'fp_gi-joe_hasbro_classified-series_classified_snake-eyes_ae7414', tag: 'Classified Series' },
  { fid: 'fp_gi-joe_hasbro_classified-series_classified_cobra-commander_005bc6', tag: 'Classified Series' },
  { fid: 'fp_marvel-comics_hasbro_marvel-legends_exclusives_doctor-strange_da9845', tag: 'Marvel Legends' },
  { fid: 'fp_marvel-comics_hasbro_marvel-legends_x-men_dazzler_0fc468', tag: 'Marvel Legends' },
]

function titleCase(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/** Resolve curated shelf entries against the KB; real sold prices (from the
 *  tape) replace the line tag where we have one. */
function buildShelf(tape: TapeItem[]): ShelfFigure[] {
  const soldByFid = new Map<string, number>()
  for (const t of tape) {
    const m = /^\/figure\/(.+)$/.exec(t.href)
    if (m && !soldByFid.has(m[1])) soldByFid.set(m[1], t.price)
  }
  const out: ShelfFigure[] = []
  for (const entry of SHELF_FIDS) {
    const kb = getFigureById(entry.fid)
    if (!kb || !kb.canonical_image_url) continue
    const sold = soldByFid.get(entry.fid)
    out.push({
      fid: entry.fid,
      href: figureUrl(kb),
      name: titleCase(kb.character_canonical),
      tag: sold != null ? `Sold $${sold.toFixed(2)}` : entry.tag,
      sold: sold != null,
      img: thumb(kb.canonical_image_url, 225) ?? kb.canonical_image_url,
    })
  }
  return out
}

/** Ticker/ledger rows: tape solds enriched with KB name/line/photo. */
function enrichTape(tape: TapeItem[]) {
  return tape.map(t => {
    const m = /^\/figure\/(.+)$/.exec(t.href)
    const kb = m ? getFigureById(m[1]) : null
    return {
      href: t.href,
      price: t.price,
      name: kb ? titleCase(kb.character_canonical) : t.label,
      lineTag: kb
        ? `${prettifySlug(kb.product_line)}${kb.release_wave && /^\d+$/.test(kb.release_wave) ? ` ${kb.release_wave}` : ''}`
        : '',
      img: kb?.canonical_image_url ? thumb(kb.canonical_image_url, 96) : null,
    }
  })
}

export default async function HomePage() {
  // Live market data — real solds or the modules hide themselves.
  const { figures: receiptFigures, tape } = await fetchHomeMarket()
  const shelf = buildShelf(tape)
  const ticker = enrichTape(tape)
  const ledger = ticker.slice(0, 3)
  const laneCount = GENRE_TAXONOMY.length

  return (
    <div className="fph">
      <style>{`
        .fph {
          --fph-cream: #f2e8d5;
          --fph-cream-dim: rgba(242,232,213,.60);
          --fph-cream-mut: rgba(242,232,213,.38);
          --fph-gold: #e0a83e;
          --fph-gold-hi: #f5c462;
          --fph-gold-mut: rgba(224,168,62,.72);
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
        .fph-hero-grid { display: grid; grid-template-columns: 1fr 1.04fr; gap: 68px; align-items: center; }
        .fph-hero-grid > * { min-width: 0; }
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
           the shelf-gold skin onto it here (important beats inline). */
        .fph-hero-search button {
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

        /* ── lanes ── */
        .fph-lines { padding: 34px 0 30px; }
        .fph-lane-row { display: flex; flex-wrap: wrap; gap: 10px 9px; align-items: center; }
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
        .fph-lane-chip.featured { border-color: rgba(224,168,62,.45); color: var(--fph-cream); background: rgba(224,168,62,.05); position: relative; overflow: hidden; }
        .fph-lane-chip.featured::before {
          content: ''; position: absolute; top: -30%; bottom: -30%; left: 0; width: 34px;
          background: linear-gradient(100deg, transparent, rgba(245,196,98,.28), transparent);
          transform: translateX(-70px) skewX(-20deg);
          animation: fph-chipShine 5.5s linear infinite; pointer-events: none;
        }
        @keyframes fph-chipShine { 0% { transform: translateX(-70px) skewX(-20deg); } 32% { transform: translateX(260px) skewX(-20deg); } 100% { transform: translateX(260px) skewX(-20deg); } }
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

        /* ── ticker ── */
        .fph-ticker { background: rgba(224,168,62,.02); overflow: hidden; position: relative; }
        .fph-ticker .fade-l, .fph-ticker .fade-r { position: absolute; top: 0; bottom: 0; width: 70px; z-index: 2; pointer-events: none; }
        .fph-ticker .fade-l { left: 0; background: linear-gradient(90deg, #09090f, transparent); }
        .fph-ticker .fade-r { right: 0; background: linear-gradient(270deg, #09090f, transparent); }
        .fph-ticker-track { display: flex; width: max-content; animation: fph-tickerMove 38s linear infinite; }
        .fph-ticker:hover .fph-ticker-track { animation-play-state: paused; }
        @keyframes fph-tickerMove { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .fph-ticker-half { display: flex; align-items: center; padding: 10px 0; flex: 0 0 auto; }
        .fph-tick-chip {
          display: inline-flex; align-items: center; gap: 10px;
          margin: 0 14px; padding: 4px 14px 4px 5px;
          border: 1px solid rgba(242,232,213,.09); border-radius: 99px; text-decoration: none;
          background: transparent; transition: border-color .25s;
        }
        .fph-tick-chip:hover { border-color: rgba(224,168,62,.45); }
        .fph-tick-thumb { width: 27px; height: 27px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(224,168,62,.40); background: #efe5d0; flex: 0 0 auto; }
        .fph-tick-name { font-size: 12px; font-weight: 500; color: var(--fph-cream); white-space: nowrap; }
        .fph-tick-line { font-size: 9.5px; font-weight: 400; letter-spacing: .1em; text-transform: uppercase; color: var(--fph-cream-mut); white-space: nowrap; }
        .fph-tick-sold { font-size: 8.5px; font-weight: 600; letter-spacing: .12em; color: #1a1206; background: var(--fph-gold); border-radius: 3px; padding: 2px 6px; }
        .fph-tick-price { font-family: var(--fp-font-display); font-size: 18px; letter-spacing: .03em; color: var(--fph-gold-hi); line-height: 1; }

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
        .fph-ledger { border: 1px solid rgba(224,168,62,.16); border-radius: 16px; background: linear-gradient(180deg, rgba(224,168,62,.035), transparent 55%); overflow: hidden; }
        .fph-ledger-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 26px; border-bottom: 1px solid rgba(242,232,213,.07); }
        .fph-ledger-head .t { font-family: var(--fp-font-display); font-size: 19px; letter-spacing: .13em; color: var(--fph-cream); }
        .fph-ledger-row { display: flex; align-items: baseline; gap: 16px; padding: 13px 26px; border-bottom: 1px solid rgba(242,232,213,.05); transition: background .2s; }
        .fph-ledger-row:last-of-type { border-bottom: none; }
        .fph-ledger-row:hover { background: rgba(224,168,62,.04); }
        .fph-ledger-row .who { flex: 0 1 auto; min-width: 0; }
        .fph-ledger-row .name { font-size: 14px; font-weight: 500; color: var(--fph-cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fph-ledger-row .line-tag { font-size: 10px; font-weight: 400; letter-spacing: .14em; text-transform: uppercase; color: var(--fph-cream-mut); margin-top: 3px; }
        .fph-ledger-row .dots { flex: 1 1 auto; border-bottom: 1px dotted rgba(242,232,213,.18); transform: translateY(-4px); min-width: 24px; }
        .fph-ledger-row .price { font-family: var(--fp-font-display); font-size: 27px; letter-spacing: .03em; color: var(--fph-gold-hi); line-height: 1; flex: 0 0 auto; }
        .fph-ledger-row .sold-chip { flex: 0 0 auto; font-size: 9px; font-weight: 600; letter-spacing: .14em; color: #1a1206; background: var(--fph-gold); border-radius: 4px; padding: 3px 7px; transform: translateY(-2px); opacity: 0; }
        .fph-solds.in .sold-chip { animation: fph-stamp .5s cubic-bezier(.34,1.56,.64,1) both; }
        .fph-solds.in .fph-ledger-row:nth-child(3) .sold-chip { animation-delay: .25s; }
        .fph-solds.in .fph-ledger-row:nth-child(4) .sold-chip { animation-delay: .5s; }
        @keyframes fph-stamp {
          0% { opacity: 0; transform: translateY(-2px) scale(2.4) rotate(-16deg); }
          62% { opacity: 1; transform: translateY(-2px) scale(.92) rotate(3deg); }
          100% { opacity: 1; transform: translateY(-2px) scale(1) rotate(-2deg); }
        }
        .fph-ledger-foot { padding: 11px 26px 13px; font-size: 11.5px; font-weight: 300; color: var(--fph-cream-mut); line-height: 1.55; border-top: 1px solid rgba(242,232,213,.06); }

        /* ── reduced motion: freeze to a good static state ── */
        @media (prefers-reduced-motion: reduce) {
          [data-fph-reveal] { opacity: 1; transform: none; transition: none; }
          [data-fph-stagger] .fph-lane-kicker, [data-fph-stagger] .fph-lane-chip { opacity: 1; transform: none; transition: none; }
          .fph-ticker-track { animation: none !important; }
          .fph-fig { animation: none !important; }
          .fph-case-light, .fph-case-sweep { display: none; }
          .fph-case::before { display: none; }
          .fph h1 .grail::after { display: none; }
          .fph-lane-chip.featured::before { display: none; }
          .fph-solds .sold-chip, .fph-solds.in .sold-chip { opacity: 1 !important; animation: none !important; transform: translateY(-2px) !important; }
          .fph-tray-thumbs img { animation: none !important; }
          .fph-fly-thumb { display: none; }
        }

        /* ── responsive ── */
        @media (max-width: 1020px) {
          .fph-hero-grid { grid-template-columns: 1fr; gap: 56px; }
          .fph-hero-sub, .fph-hero-search { max-width: 640px; }
          .fph-closer-grid { grid-template-columns: 1fr; gap: 40px; }
        }
        @media (max-width: 640px) {
          .fph .wrap { padding: 0 20px; }
          .fph-hero { padding: 40px 0 48px; }
          .fph-case { padding: 34px 14px 20px; }
          .fph-case-label { left: 18px; }
          .fph-shelf { padding: 0 2px 14px; }
          .fph-shelf-row { overflow-x: auto; scrollbar-width: none; padding-top: 14px; margin-top: -14px; }
          .fph-shelf-row::-webkit-scrollbar { display: none; }
          .fph-fig { flex: 0 0 108px; }
          .fph-ticker-half { padding: 9px 0; }
          .fph-tick-chip { margin: 0 9px; gap: 8px; }
          .fph-tick-name { font-size: 11.5px; }
          .fph-tick-price { font-size: 16px; }
          .fph-lines { padding: 28px 0 24px; }
          .fph-lane-kicker { width: 100%; margin-right: 0; margin-bottom: 2px; }
          .fph-lane-chip { padding: 7px 14px; font-size: 11px; }
          .fph-closer { padding: 46px 0 50px; }
          .fph-ledger-row { padding: 12px 18px; }
          .fph-ledger-head, .fph-ledger-foot { padding-left: 18px; padding-right: 18px; }
          .fph-ledger-row .price { font-size: 23px; }
          .fph-tray { flex-wrap: wrap; border-radius: 16px; }
          .fph-tray-cta { margin-left: 0; }
        }
      `}</style>

      <SiteHeader />
      <ScrollReveal />

      {/* ── HERO ── */}
      <section className="fph-hero">
        <div className="wrap fph-hero-grid">
          <div>
            <h1>Every <span className="grail" data-text="grail">grail</span> starts as a gap on the shelf.</h1>
            <p className="fph-hero-sub">
              <strong>{TOTAL_FIGURES_LABEL} figures</strong> across <strong>{laneCount} lanes</strong> &mdash; priced
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

            {receiptFigures.length >= 3 && (
              <div className="fph-hints">
                <span>Collectors are hunting:</span>
                {receiptFigures.slice(0, 3).map(f => (
                  <a className="fph-chip" href={f.href} key={f.fid}>{f.chipLabel}</a>
                ))}
              </div>
            )}
          </div>

          {shelf.length >= 6 && <ShelfCase figures={shelf} />}
        </div>
      </section>

      {/* ── LANES — first thing below the fold ── */}
      <section className="fph-lines fph-seam" id="lines">
        <div className="wrap">
          <div className="fph-lane-row" data-fph-reveal data-fph-stagger>
            <span className="fph-lane-kicker">Pick your lane</span>
            {GENRE_TAXONOMY.map(g => (
              <a
                key={g.slug}
                className={`fph-lane-chip${g.slug === 'wrestling' ? ' featured' : ''}`}
                href={`/${g.slug}`}
              >
                {g.name} <span className="ct">{g.totalCount}</span>
              </a>
            ))}
            <a className="fph-lane-chip all" href="/search">All {laneCount} lanes &rarr;</a>
          </div>
        </div>
      </section>

      {/* ── SOLD TICKER ── */}
      {ticker.length >= 4 && (
        <section className="fph-ticker fph-seam" aria-label="Recent real eBay sold prices">
          <div className="fade-l" aria-hidden />
          <div className="fade-r" aria-hidden />
          <div className="fph-ticker-track">
            {[0, 1].map(half => (
              <div className="fph-ticker-half" key={half} aria-hidden={half === 1}>
                {[...ticker, ...ticker].map((t, i) => (
                  <a className="fph-tick-chip" href={t.href} key={`${half}-${i}`} tabIndex={half === 1 ? -1 : undefined}>
                    {t.img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="fph-tick-thumb" src={t.img} alt="" loading="lazy" />
                    )}
                    <span className="fph-tick-name">{t.name}</span>
                    {t.lineTag && <span className="fph-tick-line">{t.lineTag}</span>}
                    <span className="fph-tick-sold">SOLD</span>
                    <span className="fph-tick-price">${t.price.toFixed(2)}</span>
                  </a>
                ))}
              </div>
            ))}
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
          {ledger.length === 3 && (
            <div className="fph-solds" data-fph-reveal>
              <div className="fph-ledger">
                <div className="fph-ledger-head">
                  <div className="t">Recent solds</div>
                </div>
                {ledger.map((t, i) => (
                  <div className="fph-ledger-row" key={i}>
                    <div className="who">
                      <div className="name">{t.name}</div>
                      {t.lineTag && <div className="line-tag">{t.lineTag}</div>}
                    </div>
                    <div className="dots" />
                    <span className="sold-chip">SOLD</span>
                    <div className="price">${t.price.toFixed(2)}</div>
                  </div>
                ))}
                <div className="fph-ledger-foot">
                  Median &middot; P10&ndash;P90 range &middot; confidence-scored. Built from real solds.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}
