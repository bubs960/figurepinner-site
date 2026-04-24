import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About FigurePinner — Real Prices for Action Figure Collectors',
  description: 'FigurePinner is a price intelligence tool for action figure collectors. Track real eBay sold prices, set deal alerts, and know exactly what your collection is worth.',
  alternates: { canonical: 'https://figurepinner.com/about' },
  openGraph: {
    title: 'About FigurePinner',
    description: 'Real eBay sold prices for 18,000+ action figures. Built by a collector, for collectors.',
    url: 'https://figurepinner.com/about',
  },
}

const CWS_URL = 'https://chromewebstore.google.com/detail/figurepinner-%E2%80%94-action-fig/okacelmjpogkmeejifeiemmnghlldbod'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', color: 'var(--text)', textDecoration: 'none' }}>
          FIGUREPINNER
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/search" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Search</a>
          <a href="/pro" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Pro</a>
        </div>
      </nav>

      <main>

        {/* Hero */}
        <section style={{
          maxWidth: '760px', margin: '0 auto',
          padding: '4rem 1.5rem 3rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.12em',
            color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '1rem',
          }}>
            About
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            letterSpacing: '0.04em',
            marginBottom: '1.25rem',
            lineHeight: '1.1',
          }}>
            BUILT FOR<br />COLLECTORS,<br />BY A COLLECTOR.
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--muted)', lineHeight: '1.75', maxWidth: '580px' }}>
            FigurePinner gives you real market intelligence on action figures — real eBay sold prices,
            deal alerts, and a personal vault to track what your collection is actually worth.
            No guessing. No inflated asking prices. Just data.
          </p>
        </section>

        {/* Origin story */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '1.25rem' }}>
            WHY IT EXISTS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: '1.75' }}>
            <p>
              Every serious collector has made the same mistake: overpaid on eBay because you had
              no idea what something actually sells for, or let a deal slip by because you weren't sure
              if it was actually a deal.
            </p>
            <p>
              FigurePinner started as a Chrome extension that overlays real sold-price data directly
              on eBay listings while you browse — so you always know if the price is fair before you
              click Buy It Now.
            </p>
            <p>
              It's grown into a full price-intelligence platform: 18,000+ figures across 17 genres,
              a wantlist with deal alerts, a vault to track your collection value, and SEO price guides
              so collectors everywhere can get a quick read on any figure.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '1.5rem' }}>
            BY THE NUMBERS
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { value: '18,000+', label: 'Figures tracked' },
              { value: '17', label: 'Genres covered' },
              { value: 'Real-time', label: 'eBay sold prices' },
              { value: 'Free', label: 'Core features' },
            ].map(({ value, label }) => (
              <div key={label} style={{
                background: 'var(--s1)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '1.25rem',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.04em', color: 'var(--blue)', marginBottom: '0.25rem' }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Genres */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '1rem' }}>
            GENRES WE COVER
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
            From vintage wrestling figures to modern Marvel Legends — if it's an action figure
            with an eBay market, we track it.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { slug: 'wrestling', label: '🤼 Wrestling' },
              { slug: 'marvel', label: '🦸 Marvel' },
              { slug: 'star-wars', label: '⚔️ Star Wars' },
              { slug: 'dc', label: '🦇 DC' },
              { slug: 'transformers', label: '🤖 Transformers' },
              { slug: 'gijoe', label: '🪖 G.I. Joe' },
              { slug: 'masters-of-the-universe', label: '⚡ MOTU' },
              { slug: 'teenage-mutant-ninja-turtles', label: '🐢 TMNT' },
              { slug: 'power-rangers', label: '🦕 Power Rangers' },
              { slug: 'indiana-jones', label: '🎩 Indiana Jones' },
              { slug: 'ghostbusters', label: '👻 Ghostbusters' },
              { slug: 'mythic-legions', label: '🗡️ Mythic Legions' },
              { slug: 'thundercats', label: '🐱 Thundercats' },
              { slug: 'dungeons-dragons', label: '🐉 D&D' },
              { slug: 'neca', label: '🎬 Horror & Film' },
              { slug: 'spawn', label: '🦇 Spawn' },
              { slug: 'action-force', label: '🎖️ Action Force' },
            ].map(({ slug, label }) => (
              <a
                key={slug}
                href={`/${slug}`}
                style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  background: 'var(--s1)', border: '1px solid var(--border)',
                  borderRadius: '100px', fontSize: '0.8125rem', color: 'var(--muted)',
                  textDecoration: 'none',
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '1.5rem' }}>
            HOW IT WORKS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              {
                step: '01',
                title: 'Install the Extension',
                body: 'The free Chrome extension overlays real sold prices directly on eBay listings as you browse. See avg sold price, recent sales history, and whether the current listing is priced well — without leaving the page.',
              },
              {
                step: '02',
                title: 'Search Any Figure',
                body: 'Type any figure name into the search bar and instantly pull up market data: average sold price, median, high/low, and a list of recent eBay sales. 18,000+ figures across 17 genres.',
              },
              {
                step: '03',
                title: 'Build Your Wantlist',
                body: 'Add figures to your Wantlist and set a target price. FigurePinner watches eBay and notifies you when a matching listing comes in at or below your target.',
              },
              {
                step: '04',
                title: 'Track Your Vault',
                body: 'Log figures you own with what you paid. Your Vault shows current market value vs. your cost basis — so you always know what your collection is worth.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: '40px', height: '40px',
                  background: 'var(--s2)', border: '1px solid var(--border)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.04em',
                  color: 'var(--blue)',
                }}>
                  {step}
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.375rem', fontSize: '0.9375rem' }}>{title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: '1.65' }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '1rem' }}>
            GET IN TOUCH
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: '1.75', marginBottom: '1rem' }}>
            Questions, feature requests, bug reports, or just want to talk action figures?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <ContactRow label="Email" value="hello@figurepinner.com" href="mailto:hello@figurepinner.com" />
            <ContactRow label="Privacy concerns" value="privacy@figurepinner.com" href="mailto:privacy@figurepinner.com" />
            <ContactRow label="Chrome Extension" value="View on Chrome Web Store" href={CWS_URL} external />
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 5rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.04em', marginBottom: '0.875rem' }}>
            READY TO START?
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.75rem', fontSize: '0.9375rem' }}>
            Install the free Chrome extension and start seeing real prices in under a minute.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={CWS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Install Free Extension
            </a>
            <a href="/sign-up" className="btn btn-ghost btn-lg">
              Create Account
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>
          © {new Date().getFullYear()} FigurePinner ·{' '}
          <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a> ·{' '}
          <a href="/terms" style={{ color: 'var(--dim)' }}>Terms</a> ·{' '}
          <a href="/pro" style={{ color: 'var(--dim)' }}>Pro</a>
        </p>
      </footer>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ContactRow({
  label,
  value,
  href,
  external,
}: {
  label: string
  value: string
  href: string
  external?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0.75rem 1rem',
      background: 'var(--s1)', border: '1px solid var(--border)',
      borderRadius: '8px', fontSize: '0.875rem',
    }}>
      <span style={{ color: 'var(--dim)', flexShrink: 0, width: '140px' }}>{label}</span>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        style={{ color: 'var(--blue)', textDecoration: 'none' }}
      >
        {value}
      </a>
    </div>
  )
}
