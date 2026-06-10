import type { Metadata } from 'next'
import GenreTaxonomy from './_components/GenreTaxonomy'
import HeroSearch from './components/HeroSearch'
import { TOTAL_FIGURES_LABEL, fandomCountForUISlug, plusLabel } from '@/data/kb-stats'
import { deriveName, figureUrl, getAllFigures, type KBFigure } from '@/data/kb'
import { prettifySlug } from './figure/[figure_id]/_lib/figureFormatters'
import { thumb } from '@/lib/imageUrl'

export const metadata: Metadata = {
  title: { absolute: 'FigurePinner - Action Figure Price Guide' },
  description: `Real sold-price data for ${TOTAL_FIGURES_LABEL} action figures. Know what any figure is worth before you bid, buy, or sell.`,
  alternates: { canonical: 'https://figurepinner.com' },
}

// Genre slugs shown on the homepage (D&D removed - see GenreTaxonomy note).
// Counts are computed from the KB at build time so they never drift.
const HOME_GENRE_SLUGS = [
  'wrestling', 'marvel', 'star-wars', 'dc', 'transformers', 'gijoe',
  'masters-of-the-universe', 'teenage-mutant-ninja-turtles', 'power-rangers',
  'neca', 'indiana-jones', 'ghostbusters', 'mythic-legions', 'thundercats',
  'action-force', 'spawn',
]

const SHOWCASE_CONFIG = [
  { fandom: 'wrestling', productLine: 'elite', needles: ['cody-rhodes', 'roman-reigns', 'rhea-ripley', 'rey-mysterio'] },
  { fandom: 'star-wars', productLine: 'black-series', needles: ['darth-vader', 'mandalorian', 'ahsoka', 'maul'] },
  { fandom: 'marvel-comics', productLine: 'marvel-legends', needles: ['spider-man', 'wolverine', 'deadpool', 'captain-america'] },
  { fandom: 'dc', productLine: 'dc-multiverse', needles: ['batman', 'superman', 'joker', 'wonder-woman'] },
  { fandom: 'transformers', productLine: 'studio-series', needles: ['optimus-prime', 'megatron', 'bumblebee'] },
  { fandom: 'gi-joe', productLine: 'classified-series', needles: ['snake-eyes', 'cobra-commander', 'storm-shadow'] },
  { fandom: 'tmnt', productLine: 'playmates-tmnt', needles: ['leonardo', 'raphael', 'donatello', 'michelangelo'] },
  { fandom: 'masters-of-the-universe', productLine: 'origins', needles: ['he-man', 'skeletor'] },
]

const RECEIPTS = [
  {
    label: 'Check the comp',
    title: 'Do not get worked by the BIN price.',
    body: 'Start with sold listings, not seller optimism. FigurePinner shows the market that actually closed.',
  },
  {
    label: 'Read the condition',
    title: 'MOC and loose are different markets.',
    body: 'Sealed, complete loose, and missing-accessory figures do not trade the same. Treat them separately.',
  },
  {
    label: 'Pin the grail',
    title: 'Track the figure before the fig hunt.',
    body: 'Save targets, watch the lane, and know when a listing is a real gap instead of ordinary heat.',
  },
]

const JOURNEY = [
  {
    step: '01',
    title: 'Search like a collector',
    body: 'Type the character, line, or wave. Jump straight to the exact figure instead of doom-scrolling active listings.',
  },
  {
    step: '02',
    title: 'Read the receipt',
    body: 'Sold comps, data-quality labels, and condition context tell you how much trust to put in the number.',
  },
  {
    step: '03',
    title: 'Build the vault',
    body: 'Pin owned figures, chase missing pieces, and keep the collection moving without spreadsheet archaeology.',
  },
]

function genreCounts(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const slug of HOME_GENRE_SLUGS) {
    out[slug] = plusLabel(fandomCountForUISlug(slug))
  }
  return out
}

function pickShowcaseFigures(): Array<{
  href: string
  image: string | null
  name: string
  line: string
  genre: string
}> {
  const all = getAllFigures()
  const used = new Set<string>()
  const picked: KBFigure[] = []

  for (const slot of SHOWCASE_CONFIG) {
    const candidates = all.filter(f =>
      f.fandom === slot.fandom &&
      f.product_line === slot.productLine &&
      !!f.canonical_image_url &&
      !used.has(f.figure_id)
    )

    const matched = slot.needles
      .map(needle => candidates.find(f => {
        const haystack = `${f.character_canonical} ${f.v1_name ?? ''}`.toLowerCase()
        return haystack.includes(needle.replace(/-/g, ' '))
          || haystack.includes(needle)
      }))
      .find(Boolean)

    const selected = matched ?? candidates[0]
    if (selected) {
      picked.push(selected)
      used.add(selected.figure_id)
    }
  }

  if (picked.length < 8) {
    for (const figure of all) {
      if (picked.length >= 8) break
      if (!figure.canonical_image_url || used.has(figure.figure_id)) continue
      if (!HOME_GENRE_SLUGS.includes(figure.fandom) && figure.fandom !== 'marvel-comics' && figure.fandom !== 'gi-joe' && figure.fandom !== 'tmnt') continue
      picked.push(figure)
      used.add(figure.figure_id)
    }
  }

  return picked.slice(0, 8).map(f => ({
    href: figureUrl(f),
    image: thumb(f.canonical_image_url, 360),
    name: f.v1_name ?? deriveName(f),
    line: f.v1_line ?? prettifySlug(f.product_line),
    genre: prettifySlug(f.fandom === 'marvel-comics' ? 'marvel' : f.fandom),
  }))
}

export default function HomePage() {
  const counts = genreCounts()
  const showcase = pickShowcaseFigures()
  const heroFigures = showcase.slice(0, 8)

  return (
    <div className="fp-home">
      <style>{`
        .fp-home {
          min-height: 100vh;
          background: #09090f;
          color: var(--text);
          font-family: var(--font-body, system-ui);
        }
        .fp-home-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 56px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(9,9,15,0.9);
          backdrop-filter: blur(12px);
        }
        .fp-home-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--text);
          text-decoration: none;
          font-weight: 800;
        }
        .fp-home-brand-mark {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #e53238;
          color: #fff;
          font-family: var(--font-display);
          font-size: 1.1rem;
          line-height: 1;
        }
        .fp-home-nav-links,
        .fp-home-nav-actions {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .fp-home-nav a {
          color: var(--text);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 650;
        }
        .fp-home-join {
          padding: 8px 14px;
          border-radius: 8px;
          background: #eeeef5;
          color: #09090f !important;
        }
        .fp-hero {
          position: relative;
          overflow: hidden;
          min-height: calc(100vh - 56px);
          display: flex;
          align-items: center;
          padding: 78px 24px 56px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background:
            linear-gradient(180deg, rgba(9,9,15,0.42), #09090f 92%),
            linear-gradient(110deg, rgba(229,50,56,0.18), rgba(0,102,255,0.10) 38%, rgba(0,200,112,0.08));
        }
        .fp-hero-wall {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(8, minmax(118px, 1fr));
          gap: 14px;
          padding: 38px 24px;
          opacity: 0.58;
          transform: rotate(-4deg) scale(1.08);
          pointer-events: none;
        }
        .fp-hero-wall::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, #09090f 0%, rgba(9,9,15,0.38) 20%, rgba(9,9,15,0.2) 70%, #09090f 100%),
            linear-gradient(180deg, rgba(9,9,15,0.15), #09090f 95%);
        }
        .fp-wall-card {
          min-height: 172px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          background: rgba(20,20,32,0.78);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 18px 48px rgba(0,0,0,0.34);
        }
        .fp-wall-card:nth-child(odd) {
          transform: translateY(44px);
        }
        .fp-wall-card img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 18px;
          filter: saturate(1.04) contrast(1.04);
        }
        .fp-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1040px;
          margin: 0 auto;
          width: 100%;
          text-align: center;
        }
        .fp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          padding: 7px 13px;
          color: #eeeef5;
          background: rgba(9,9,15,0.72);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .fp-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00c870;
        }
        .fp-hero h1 {
          max-width: 820px;
          margin: 22px auto 18px;
          font-family: var(--font-display);
          font-size: 4.8rem;
          line-height: 0.92;
          letter-spacing: 0;
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 10px 40px rgba(0,0,0,0.62);
        }
        .fp-hero-copy {
          max-width: 660px;
          margin: 0 auto 22px;
          color: #eeeef5;
          font-size: 1.08rem;
          line-height: 1.7;
          opacity: 0.92;
        }
        .fp-hero-actions {
          max-width: 720px;
          margin: 0 auto;
          padding: 16px 0 0;
        }
        .fp-proof-row {
          margin: 24px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          max-width: 760px;
        }
        .fp-proof {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          background: rgba(9,9,15,0.72);
          padding: 14px 16px;
          text-align: left;
        }
        .fp-proof strong {
          display: block;
          color: #fff;
          font-size: 0.86rem;
          margin-bottom: 4px;
        }
        .fp-proof span {
          display: block;
          color: rgba(238,238,245,0.74);
          font-size: 0.75rem;
          line-height: 1.45;
        }
        .fp-featured-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          max-width: 980px;
          margin: 34px auto 0;
        }
        .fp-featured-figure {
          min-width: 0;
          display: grid;
          grid-template-columns: 64px 1fr;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          background: rgba(20,20,32,0.84);
          color: #eeeef5;
          text-decoration: none;
        }
        .fp-featured-figure:hover {
          color: #fff;
          border-color: rgba(229,50,56,0.5);
          background: rgba(26,26,46,0.92);
        }
        .fp-featured-thumb {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          background: #09090f;
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .fp-featured-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 7px;
        }
        .fp-featured-name {
          color: #fff;
          font-size: 0.78rem;
          font-weight: 800;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .fp-featured-line {
          margin-top: 4px;
          color: rgba(238,238,245,0.7);
          font-size: 0.68rem;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fp-band {
          padding: 72px 24px;
        }
        .fp-band.alt {
          background: #0d0d15;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .fp-section {
          max-width: 1040px;
          margin: 0 auto;
        }
        .fp-section-head {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: end;
          margin-bottom: 24px;
        }
        .fp-section-kicker {
          color: #e53238;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .fp-section h2 {
          font-family: var(--font-display);
          font-size: 3rem;
          line-height: 0.96;
          letter-spacing: 0;
          text-transform: uppercase;
          color: #fff;
        }
        .fp-section-head p {
          max-width: 390px;
          color: rgba(238,238,245,0.78);
          font-size: 0.95rem;
        }
        .fp-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .fp-receipt-card,
        .fp-journey-card {
          min-height: 100%;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          background: #141420;
          padding: 22px;
        }
        .fp-receipt-label {
          display: inline-flex;
          border-radius: 999px;
          border: 1px solid rgba(0,200,112,0.28);
          color: #00c870;
          background: rgba(0,200,112,0.08);
          padding: 5px 9px;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .fp-receipt-card h3,
        .fp-journey-card h3 {
          font-size: 1rem;
          color: #fff;
          margin-bottom: 10px;
        }
        .fp-receipt-card p,
        .fp-journey-card p {
          color: rgba(238,238,245,0.76);
          font-size: 0.88rem;
          line-height: 1.62;
        }
        .fp-journey-step {
          font-family: var(--font-display);
          color: #ffb800;
          font-size: 2.4rem;
          line-height: 1;
          margin-bottom: 18px;
        }
        .fp-collector-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .fp-split-panel {
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: #141420;
          padding: 24px;
        }
        .fp-split-panel h3 {
          color: #fff;
          font-size: 1.05rem;
          margin-bottom: 10px;
        }
        .fp-split-panel p {
          color: rgba(238,238,245,0.76);
          line-height: 1.65;
          font-size: 0.9rem;
        }
        .fp-genre-wrap {
          max-width: 1040px;
          margin: 0 auto;
        }
        .fp-bottom-cta {
          text-align: center;
          padding: 72px 24px 84px;
          background:
            linear-gradient(180deg, #09090f, rgba(229,50,56,0.16)),
            #09090f;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .fp-bottom-cta h2 {
          max-width: 680px;
          margin: 0 auto 14px;
          font-family: var(--font-display);
          font-size: 3.2rem;
          line-height: 0.96;
          letter-spacing: 0;
          text-transform: uppercase;
          color: #fff;
        }
        .fp-bottom-cta p {
          max-width: 520px;
          margin: 0 auto 28px;
          color: rgba(238,238,245,0.78);
        }
        .fp-cta-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .fp-primary-btn,
        .fp-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 20px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.92rem;
          text-decoration: none;
        }
        .fp-primary-btn {
          background: #e53238;
          color: #fff;
          box-shadow: 0 14px 34px rgba(229,50,56,0.28);
        }
        .fp-secondary-btn {
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff;
          background: rgba(20,20,32,0.8);
        }
        @media (max-width: 920px) {
          .fp-home-nav-links {
            display: none;
          }
          .fp-hero {
            min-height: auto;
            padding-top: 62px;
          }
          .fp-hero h1 {
            font-size: 3.35rem;
          }
          .fp-hero-copy {
            font-size: 1rem;
          }
          .fp-hero-wall {
            grid-template-columns: repeat(4, minmax(120px, 1fr));
            opacity: 0.34;
          }
          .fp-proof-row,
          .fp-card-grid,
          .fp-collector-split {
            grid-template-columns: 1fr;
          }
          .fp-featured-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .fp-section-head {
            display: block;
          }
          .fp-section h2,
          .fp-bottom-cta h2 {
            font-size: 2.45rem;
          }
          .fp-section-head p {
            margin-top: 12px;
            max-width: none;
          }
        }
        @media (max-width: 560px) {
          .fp-home-nav {
            padding: 0 14px;
          }
          .fp-home-brand span:last-child,
          .fp-home-nav-actions a:first-child {
            display: none;
          }
          .fp-home-join {
            padding: 8px 10px;
          }
          .fp-hero {
            padding: 48px 14px 36px;
          }
          .fp-hero h1 {
            font-size: 2.7rem;
          }
          .fp-proof {
            text-align: center;
          }
          .fp-featured-strip {
            grid-template-columns: 1fr;
          }
          .fp-band {
            padding: 54px 14px;
          }
          .fp-hero-wall {
            grid-template-columns: repeat(3, minmax(110px, 1fr));
            gap: 10px;
            padding: 24px 8px;
          }
          .fp-wall-card {
            min-height: 136px;
          }
        }
      `}</style>

      <nav className="fp-home-nav" aria-label="Main">
        <a className="fp-home-brand" href="/">
          <span className="fp-home-brand-mark">FP</span>
          <span>FigurePinner</span>
        </a>
        <div className="fp-home-nav-links">
          <a href="/search">Search</a>
          <a href="/guides">Guides</a>
          <a href="/methodology">Methodology</a>
          <a href="/app/wantlist">Wantlist</a>
        </div>
        <div className="fp-home-nav-actions">
          <a href="/sign-in">Log in</a>
          <a className="fp-home-join" href="/sign-up">Sign up free</a>
        </div>
      </nav>

      <section className="fp-hero">
        <div className="fp-hero-wall" aria-hidden>
          {heroFigures.map((figure, index) => (
            <div className="fp-wall-card" key={`${figure.href}-${index}`}>
              {figure.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={figure.image} alt="" />
              )}
            </div>
          ))}
        </div>

        <div className="fp-hero-inner">
          <div className="fp-eyebrow">
            <span className="fp-eyebrow-dot" />
            {TOTAL_FIGURES_LABEL} figures. Sold comps first. Browse free.
          </div>

          <h1>Stop getting worked by asking prices.</h1>
          <p className="fp-hero-copy">
            FigurePinner is the price guide and collector cockpit for action figures:
            real sold comps, honest data-quality labels, vault tracking, wantlists, and fig-hunt alerts.
          </p>

          <div className="fp-hero-actions">
            <HeroSearch totalLabel={TOTAL_FIGURES_LABEL} />
          </div>

          <div className="fp-proof-row" aria-label="FigurePinner proof points">
            <div className="fp-proof">
              <strong>No asking-price kayfabe</strong>
              <span>Sold listings drive the read. We label thin data instead of pretending.</span>
            </div>
            <div className="fp-proof">
              <strong>Openers and MOC collectors</strong>
              <span>Condition matters. The tool respects both display shelves and sealed walls.</span>
            </div>
            <div className="fp-proof">
              <strong>Built for the hunt</strong>
              <span>Search now. Pin later. Track the figure before someone else spots the gap.</span>
            </div>
          </div>

          <div className="fp-featured-strip" aria-label="Featured figure lines">
            {showcase.slice(0, 4).map(figure => (
              <a className="fp-featured-figure" href={figure.href} key={figure.href}>
                <span className="fp-featured-thumb">
                  {figure.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={figure.image} alt="" />
                  )}
                </span>
                <span>
                  <span className="fp-featured-name">{figure.name}</span>
                  <span className="fp-featured-line">{figure.line} · {figure.genre}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-band">
        <div className="fp-section">
          <div className="fp-section-head">
            <div>
              <div className="fp-section-kicker">The receipt beats the hype</div>
              <h2>The collector loop, minus the guesswork.</h2>
            </div>
            <p>
              The homepage should drop you into the real job: checking value, reading condition,
              and deciding whether a figure deserves a pin.
            </p>
          </div>

          <div className="fp-card-grid">
            {RECEIPTS.map(item => (
              <article className="fp-receipt-card" key={item.title}>
                <div className="fp-receipt-label">{item.label}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-band alt">
        <div className="fp-section">
          <div className="fp-section-head">
            <div>
              <div className="fp-section-kicker">From first search to finished wave</div>
              <h2>A real journey from first search to finished wave.</h2>
            </div>
            <p>
              Browse without friction. Create an account only when the tool has already
              proven it belongs in your fig hunt.
            </p>
          </div>

          <div className="fp-card-grid">
            {JOURNEY.map(item => (
              <article className="fp-journey-card" key={item.step}>
                <div className="fp-journey-step">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-band">
        <div className="fp-section">
          <div className="fp-section-head">
            <div>
              <div className="fp-section-kicker">Both camps, one market</div>
              <h2>Let it breathe or keep it MOC. The data does not care.</h2>
            </div>
            <p>
              FigurePinner sits in the middle of the hobby's oldest argument and gives each side
              the numbers they need.
            </p>
          </div>

          <div className="fp-collector-split">
            <div className="fp-split-panel">
              <h3>For sealed-wall collectors</h3>
              <p>
                See when card, bubble, exclusivity, and wave scarcity are doing real work in the sold comps.
                If MOC carries a premium, the market should prove it.
              </p>
            </div>
            <div className="fp-split-panel">
              <h3>For openers and display shelves</h3>
              <p>
                Loose complete is its own lane. Missing belts, hands, heads, weapons, and stands can move
                the price more than the seller wants to admit.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fp-band alt">
        <div className="fp-genre-wrap">
          <div className="fp-section-head">
            <div>
              <div className="fp-section-kicker">Pick your aisle</div>
              <h2>Every collector has a lane.</h2>
            </div>
            <p>
              Wrestling, Marvel Legends, Black Series, Classified, MOTU, TMNT, horror, and more.
              Start broad, then drill into the exact line.
            </p>
          </div>
          <GenreTaxonomy counts={counts} />
        </div>
      </section>

      <section className="fp-bottom-cta">
        <h2>Pin the grail before the market pops.</h2>
        <p>
          Search is free. The vault is where your figures, targets, and alerts start working together.
        </p>
        <div className="fp-cta-row">
          <a className="fp-primary-btn" href="/search">Search the price guide</a>
          <a className="fp-secondary-btn" href="/sign-up">Create my free vault</a>
        </div>
      </section>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}
