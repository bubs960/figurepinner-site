import type { Metadata } from 'next'
import GenreTaxonomy from './_components/GenreTaxonomy'
import HeroSearch from './components/HeroSearch'
import PriceReceipt from './components/PriceReceipt'
import { fetchHomeMarket } from './_lib/homeReceipt'
import { TOTAL_FIGURES_LABEL } from '@/data/kb-stats'
import { GENRE_TAXONOMY } from '@/data/genre-lines'

export const metadata: Metadata = {
  title: { absolute: 'FigurePinner - Action Figure Price Guide' },
  description: `Real sold-price data for ${TOTAL_FIGURES_LABEL} action figures. Know what any figure is worth before you bid, buy, or sell.`,
  alternates: { canonical: 'https://figurepinner.com' },
}

function fmtTape(n: number): string {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`
}

// Film-grain texture, inlined so it costs zero requests.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`

export default async function HomePage() {
  // Live price snapshots for the receipt demo + sold tape — real numbers or
  // the modules hide themselves.
  const { figures: receiptFigures, tape } = await fetchHomeMarket()
  const showReceipt = receiptFigures.length >= 2
  const showTape = tape.length >= 6

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
          padding: 76px 24px 68px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background:
            radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1.4px) 0 0 / 26px 26px,
            #09090f;
        }
        /* Aurora — two slow-drifting light pools behind everything. GPU-only
           (transform + filter), low opacity so text contrast never suffers. */
        .fp-aurora {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .fp-aurora::before,
        .fp-aurora::after {
          content: '';
          position: absolute;
          width: 56vw;
          height: 56vw;
          max-width: 900px;
          max-height: 900px;
          border-radius: 50%;
          filter: blur(90px);
          will-change: transform;
        }
        .fp-aurora::before {
          background: radial-gradient(circle, rgba(0,102,255,0.20), transparent 62%);
          top: -22%;
          left: -8%;
          animation: fp-drift-a 26s ease-in-out infinite alternate;
        }
        .fp-aurora::after {
          background: radial-gradient(circle, rgba(0,200,112,0.13), transparent 62%);
          bottom: -32%;
          right: -12%;
          animation: fp-drift-b 32s ease-in-out infinite alternate;
        }
        @keyframes fp-drift-a { to { transform: translate(7vw, 6vh) scale(1.12); } }
        @keyframes fp-drift-b { to { transform: translate(-6vw, -5vh) scale(1.08); } }
        .fp-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.05;
          background-image: ${GRAIN};
        }
        .fp-hero-grid {
          position: relative;
          z-index: 1;
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
        }
        .fp-hero-grid.solo {
          grid-template-columns: 1fr;
          max-width: 760px;
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
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          animation: fp-h1-rise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .fp-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00c870;
          box-shadow: 0 0 8px rgba(0,200,112,0.8);
        }
        .fp-hero h1 {
          margin: 20px 0 14px;
          font-family: var(--font-display);
          font-size: clamp(3.2rem, 6vw, 5.6rem);
          line-height: 0.94;
          letter-spacing: 0;
          text-transform: uppercase;
          color: #fff;
          text-wrap: balance;
          text-shadow: 0 10px 40px rgba(0,0,0,0.62);
        }
        .fp-h1-line {
          display: block;
          animation: fp-h1-rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .fp-h1-line:nth-child(2) { animation-delay: 0.12s; }
        @keyframes fp-h1-rise {
          from { opacity: 0; transform: translateY(28px); }
        }
        /* Green shimmer on the payoff line — static green when motion is off. */
        .fp-h1-shimmer {
          background: linear-gradient(110deg, #00c870 25%, #b8ffe0 50%, #00c870 75%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: none;
          filter: drop-shadow(0 0 24px rgba(0,200,112,0.25));
          animation: fp-shimmer 3.8s linear 1.2s infinite;
        }
        @keyframes fp-shimmer { to { background-position: -220% 0; } }
        .fp-hero-copy {
          max-width: 480px;
          margin: 0 0 26px;
          color: #eeeef5;
          font-size: 1.05rem;
          line-height: 1.65;
          opacity: 0.92;
          text-wrap: balance;
          animation: fp-h1-rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both;
        }
        .fp-hero-grid.solo .fp-hero-copy { margin: 0 auto 26px; }
        .fp-hero-search {
          scroll-margin-top: 90px;
          animation: fp-h1-rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.28s both;
        }
        .fp-hero-search > div { margin: 0 0 10px !important; }
        .fp-hero-grid.solo .fp-hero-search > div { margin: 0 auto 10px !important; }
        @keyframes fp-search-flash {
          0%, 100% { box-shadow: none; }
          35% { box-shadow: 0 0 0 3px rgba(0,102,255,0.55); }
        }
        .fp-hero-search:target { animation: fp-search-flash 1.2s ease 1; border-radius: 12px; }
        .fp-hero-micro {
          font-size: 0.78rem;
          color: rgba(238,238,245,0.6);
          animation: fp-h1-rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.36s both;
        }
        .fp-hero-micro kbd {
          font-family: var(--font-ui);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 0 5px;
          font-size: 0.72rem;
        }
        /* Solo (degraded) mode: recenter the dot grid's companion glow since
           the two-column composition is gone. */
        .fp-hero:has(.fp-hero-grid.solo) .fp-aurora::before {
          left: 50%;
          top: -30%;
          transform: translateX(-50%);
          animation: none;
        }
        /* THE TAPE — real solds ticker. Pure CSS marquee: duplicated track,
           translateX(-50%) loop, hover pause, faded edges. */
        .fp-tape {
          display: flex;
          align-items: stretch;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: #0d0d15;
        }
        .fp-tape-lead {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 0.66rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          color: #eeeef5;
          border-right: 1px solid rgba(255,255,255,0.1);
          background: #09090f;
          z-index: 1;
          white-space: nowrap;
        }
        .fp-tape-mark {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          background: #e53238;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 0.56rem;
        }
        .fp-tape-viewport {
          flex: 1;
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
        }
        .fp-tape-track {
          display: flex;
          width: max-content;
          animation: fp-tape-scroll 48s linear infinite;
          will-change: transform;
        }
        .fp-tape-viewport:hover .fp-tape-track { animation-play-state: paused; }
        @keyframes fp-tape-scroll { to { transform: translateX(-50%); } }
        .fp-tape-seg { display: flex; }
        .fp-tape-chip {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          padding: 12px 22px;
          text-decoration: none;
          white-space: nowrap;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .fp-tape-chip:hover .fp-tape-name { color: #fff; }
        .fp-tape-name {
          font-family: var(--font-display);
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          color: rgba(238,238,245,0.82);
        }
        .fp-tape-price {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--green);
          font-variant-numeric: tabular-nums;
        }
        .fp-strip {
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: #0d0d15;
          padding: 18px 24px;
        }
        .fp-strip-inner {
          max-width: 1040px;
          margin: 0 auto;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          text-align: center;
        }
        .fp-strip p {
          color: rgba(238,238,245,0.78);
          font-size: 0.88rem;
          line-height: 1.6;
          max-width: 760px;
        }
        .fp-strip a {
          font-size: 0.85rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .fp-band {
          padding: 72px 24px;
        }
        .fp-section-head {
          max-width: 1040px;
          margin: 0 auto 24px;
        }
        .fp-section-kicker {
          color: #e53238;
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .fp-section-head h2 {
          font-family: var(--font-display);
          font-size: 2.9rem;
          line-height: 0.96;
          text-transform: uppercase;
          color: #fff;
        }
        .fp-section-head p {
          margin-top: 10px;
          color: rgba(238,238,245,0.78);
          font-size: 0.95rem;
          max-width: 560px;
        }
        .fp-genre-wrap {
          max-width: 1040px;
          margin: 0 auto;
        }
        .fp-vault-band {
          padding: 80px 24px 96px;
          background:
            radial-gradient(ellipse 50% 60% at 50% 100%, rgba(0,102,255,0.12), rgba(9,9,15,0) 70%),
            #09090f;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .fp-vault-card {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
          background: #141420;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 44px 36px;
        }
        .fp-vault-card h2 {
          font-family: var(--font-display);
          font-size: 2.9rem;
          line-height: 0.96;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 14px;
        }
        .fp-vault-card p {
          color: rgba(238,238,245,0.8);
          line-height: 1.7;
          font-size: 0.95rem;
          max-width: 520px;
          margin: 0 auto 26px;
        }
        .fp-vault-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .fp-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 22px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.92rem;
          text-decoration: none;
          background: #0066ff;
          color: #fff;
          box-shadow: 0 14px 34px rgba(0,102,255,0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .fp-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(0,102,255,0.36);
          color: #fff;
        }
        .fp-text-link {
          color: rgba(238,238,245,0.75);
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .fp-text-link:hover { color: #fff; }
        /* Scroll-triggered reveal — progressive enhancement only (Chromium). */
        @supports (animation-timeline: view()) {
          .fp-reveal {
            animation: fp-rise both;
            animation-timeline: view();
            animation-range: entry 0% entry 38%;
          }
          @keyframes fp-rise {
            from { opacity: 0; transform: translateY(26px); }
            to { opacity: 1; transform: none; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-reveal, .fp-eyebrow, .fp-h1-line, .fp-h1-shimmer, .fp-hero-copy,
          .fp-hero-search, .fp-hero-micro, .fp-aurora::before, .fp-aurora::after {
            animation: none;
          }
          .fp-hero-search:target { animation: none; }
          .fp-tape-track {
            animation: none;
          }
          .fp-tape-viewport {
            overflow-x: auto;
            mask-image: none;
            -webkit-mask-image: none;
          }
        }
        @media (max-width: 920px) {
          .fp-home-nav-links { display: none; }
          .fp-hero { padding: 52px 18px 48px; }
          .fp-hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .fp-hero h1 { font-size: clamp(2.9rem, 11vw, 4rem); }
          .fp-section-head h2, .fp-vault-card h2 { font-size: 2.4rem; }
          .fp-band { padding: 56px 18px; }
          .fp-tape-lead { display: none; }
        }
        @media (max-width: 560px) {
          .fp-home-nav { padding: 0 14px; }
          .fp-home-brand span:last-child,
          .fp-home-nav-actions a:first-child { display: none; }
          .fp-home-join { padding: 8px 10px; }
          .fp-hero { padding: 40px 14px 40px; }
          .fp-hero-micro-key { display: none; }
          .fp-vault-card { padding: 34px 20px; }
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
        <div className="fp-aurora" aria-hidden />
        <div className="fp-grain" aria-hidden />
        <div className={`fp-hero-grid${showReceipt ? '' : ' solo'}`}>
          <div>
            <div className="fp-eyebrow">
              <span className="fp-eyebrow-dot" />
              {TOTAL_FIGURES_LABEL} figures · priced from solds, not listings
            </div>

            <h1>
              <span className="fp-h1-line">Asking prices lie.</span>
              <span className="fp-h1-line fp-h1-shimmer">Solds don&apos;t.</span>
            </h1>
            <p className="fp-hero-copy">
              Type a figure. Median sold, true range, comp count, before the auction closes.
            </p>

            <div className="fp-hero-search" id="search">
              <HeroSearch
                totalLabel={TOTAL_FIGURES_LABEL}
                placeholder="Name the fig. We'll pull the comps."
                placeholderExamples={showReceipt ? receiptFigures.map(f => f.chipLabel) : undefined}
                showButton
              />
            </div>
            <div className="fp-hero-micro">
              <span>No account needed.</span>{' '}
              <span className="fp-hero-micro-key">Press <kbd>/</kbd> to jump to search.</span>
            </div>
          </div>

          {showReceipt && (
            <div>
              <PriceReceipt figures={receiptFigures} />
            </div>
          )}
        </div>
      </section>

      {showTape && (
        <div className="fp-tape" aria-label="Recent real eBay sold prices">
          <div className="fp-tape-lead">
            <span className="fp-tape-mark">FP</span>
            REAL EBAY SOLDS
          </div>
          <div className="fp-tape-viewport">
            <div className="fp-tape-track">
              {[0, 1].map(dup => (
                <div className="fp-tape-seg" key={dup} aria-hidden={dup === 1}>
                  {tape.map((t, i) => (
                    <a className="fp-tape-chip" href={t.href} key={`${dup}-${i}`} tabIndex={dup === 1 ? -1 : undefined}>
                      <span className="fp-tape-name">{t.label}</span>
                      <span className="fp-tape-price">SOLD {fmtTape(t.price)}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Methodology strip — renders unconditionally so a price-fetch outage
          still leaves one trust statement on the page. */}
      <div className="fp-strip">
        <div className="fp-strip-inner">
          <p>
            Median of real solds. A P10–P90 spread so one weird sale can&apos;t work the
            number. A confidence score from comp depth. Thin comps get flagged, never
            hidden, and the BIN somebody&apos;s been relisting since March never touches the math.
          </p>
          <a href="/methodology">How pricing works →</a>
        </div>
      </div>

      <section className="fp-band fp-reveal">
        <div className="fp-section-head">
          <div className="fp-section-kicker">Browse the catalog</div>
          <h2>Pick your lane.</h2>
          <p>
            Sixteen lanes, real counts. Wrestling runs deepest. We know what we are.
          </p>
        </div>
        <div className="fp-genre-wrap">
          <GenreTaxonomy genres={GENRE_TAXONOMY} />
        </div>
      </section>

      <section className="fp-vault-band fp-reveal">
        <div className="fp-vault-card">
          <h2>Pin the grail before it pops.</h2>
          <p>
            A free account adds a Vault for what you own and a Wantlist for what
            you&apos;re hunting. When comps move on a pinned figure, you hear about it
            first. No newsletter ambush, no upsell carousel.
          </p>
          <div className="fp-vault-actions">
            <a className="fp-primary-btn" href="/sign-up">Pin your first grail</a>
            <a className="fp-text-link" href="#search">Keep searching free</a>
          </div>
        </div>
      </section>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}
