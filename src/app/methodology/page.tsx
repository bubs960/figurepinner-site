import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How We Calculate Prices — Methodology',
  description:
    'How FigurePinner turns completed eBay sales into a price: median over average, comp-count confidence tiers, recent-vs-older trend, and what each data-quality label means.',
  alternates: { canonical: 'https://figurepinner.com/methodology' },
}

// Static marketing/trust page — emit s-maxage so the colo edge cache stores it.
export const revalidate = 86400

export default function MethodologyPage() {
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
        <a href="/search" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Search figures</a>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          HOW WE CALCULATE PRICES
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '3rem', lineHeight: 1.6 }}>
          Every price on FigurePinner comes from real comps — what figures actually sold for,
          not what sellers are asking. Here is exactly how we turn those sales into a number, and how to
          read the confidence labels so you know how much to trust it before you bid.
        </p>

        <ProseSection title="Where the data comes from">
          <p>Prices are built from <strong>comps — completed (sold) listings</strong> that actually closed, sourced from publicly available eBay sold data. Current &ldquo;for sale&rdquo; asking prices are tracked separately and never mixed into the sold numbers, because what a seller hopes to get is not what the market paid.</p>
          <p>Comp summaries refresh roughly hourly, so the median you see reflects recent market activity rather than a stale snapshot.</p>
        </ProseSection>

        <ProseSection title="Median, not average">
          <p>The headline number is the <strong>median</strong> — the middle sale price — not the average. One sealed grail or one beat-up loose figure can drag an average far from reality; the median ignores those extremes and lands on the typical sale. When there aren&apos;t enough comps to compute a stable median, we fall back to the average and label the data accordingly.</p>
          <p>We also show the <strong>range</strong> (lowest and highest recent comps) and, when there are enough of them, the middle 50% band (25th–75th percentile) so you can see how tightly a figure actually trades. A loose figure and a MOC copy of the same character won&apos;t sell for the same money — the spread tells you that at a glance.</p>
        </ProseSection>

        <ProseSection title="Comp count is everything">
          <p>A median from 40 comps means something. A median from 2 is an anecdote. So every figure carries a visible <strong>data-quality label</strong> based on how many recent comps we have:</p>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.7 }}>
            <li><strong>Reliable Pricing</strong> — 10+ comps. The median is meaningful; bid with confidence.</li>
            <li><strong>Limited Data</strong> — 4–9 comps. Enough to direction-check, not enough to bid hard against. Treat the median as an estimate.</li>
            <li><strong>Sparse Data</strong> — 1–3 comps. An anchor point only. Directional — verify before you bid.</li>
            <li><strong>No Sold Data Yet</strong> — 0 comps. We won&apos;t invent a number. We point you to search eBay sold comps directly instead.</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>We would rather tell you &ldquo;we don&apos;t have enough data&rdquo; than show a confident-looking price we can&apos;t stand behind.</p>
        </ProseSection>

        <ProseSection title="Trend: is it heating up or cooling down?">
          <p>When a figure has enough comp history, we compare its <strong>average sale price over the last 30 days</strong> against the <strong>30-to-90-day window</strong> before that. That percentage swing is the trend signal — it tells you whether a figure is heating up, flat, or cooling off. We only show a trend when there are enough comps in both windows to make the comparison honest (at least three in each); otherwise we show nothing rather than a noisy arrow.</p>
        </ProseSection>

        <ProseSection title="What this is — and isn't">
          <p>FigurePinner price estimates are for informational purposes only. They are not appraisals, not guarantees of value, and not investment advice. Real prices vary with condition — loose vs. complete vs. MOC — plus accessories, packaging, timing, and luck. Use our number as a fast, honest starting point, then look at the actual recent comps we link to before you bid, buy, or sell.</p>
          <p>Spot something that looks wrong? That feedback makes the data better — reach us at <a href="mailto:hello@figurepinner.com">hello@figurepinner.com</a>.</p>
        </ProseSection>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2.5rem' }}>
          <a href="/search" style={{
            display: 'inline-block', padding: '10px 20px', background: 'var(--blue)',
            color: '#fff', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
          }}>
            See it in action →
          </a>
          <a href="/guides" style={{
            display: 'inline-block', padding: '10px 20px', background: 'transparent',
            color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px',
            fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
          }}>
            Browse the guides
          </a>
        </div>

      </main>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}

function ProseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.25rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.25rem',
        letterSpacing: '0.03em', marginBottom: '0.625rem', color: 'var(--text)',
      }}>
        {title}
      </h2>
      <div style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  )
}
