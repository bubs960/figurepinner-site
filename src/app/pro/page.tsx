import type { Metadata } from 'next'
import ProPricingCards from './_components/ProPricingCards'

export const metadata: Metadata = {
  title: 'FigurePinner Pro — Serious Collectors Only',
  description: 'Unlimited vault, full price history, deal alerts, and export for $3.99/month or $29.99/year. Free forever for casual collectors.',
  alternates: { canonical: 'https://figurepinner.com/pro' },
}

export default function ProPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--s1)',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', color: 'var(--text)', textDecoration: 'none' }}>
          FIGURE<span style={{ color: 'var(--blue)' }}>PINNER</span>
        </a>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="/app" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Dashboard</a>
          <a href="/sign-up" style={{
            background: 'var(--blue)', color: '#fff', textDecoration: 'none',
            padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600',
          }}>Get Pro</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '5rem 1rem 3rem', maxWidth: '680px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(0,102,255,0.15)', color: 'var(--blue)',
          fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em',
          padding: '0.375rem 0.875rem', borderRadius: '100px', marginBottom: '1.25rem',
          border: '1px solid rgba(0,102,255,0.3)',
        }}>
          FIGUREPINNER PRO
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2.25rem, 6vw, 3.25rem)',
          letterSpacing: '0.03em', lineHeight: 1.05, margin: '0 0 1rem',
        }}>
          FOR COLLECTORS WHO<br />
          <span style={{ color: 'var(--blue)' }}>HUNT SERIOUSLY</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
          Full price history, unlimited vault, deal alerts, and CSV export — everything you need to buy right and never miss a flip.
        </p>
        {/* Section 9 philosophy */}
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>
          Free FigurePinner is not a trial. It&apos;s free forever, and it&apos;s the version most of our users will use. Pro exists for collectors and flippers who need more.
        </p>
      </section>

      {/* Pricing cards — client component for annual/monthly toggle */}
      <ProPricingCards />

      {/* Feature comparison table */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1rem 5rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em',
          textAlign: 'center', marginBottom: '1.5rem',
        }}>
          WHAT YOU GET
        </h2>
        <style>{`
          .fp-compare-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
          .fp-compare-table th { padding: 0.625rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; color: var(--muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
          .fp-compare-table th:not(:first-child) { text-align: center; }
          .fp-compare-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
          .fp-compare-table td:not(:first-child) { text-align: center; }
          .fp-compare-table tr:last-child td { border-bottom: none; }
          .fp-compare-table .category { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; color: var(--blue); text-transform: uppercase; padding-top: 1.25rem; }
        `}</style>
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table className="fp-compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th style={{ color: 'var(--blue)' }}>Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="category" colSpan={3}>Search &amp; Lookup</td></tr>
              <tr><td>Figure lookup (extension)</td><td><Check /></td><td><Check blue /></td></tr>
              <tr><td>Monthly searches</td><td style={{ color: 'var(--muted)' }}>100/mo</td><td><Check blue label="Unlimited" /></td></tr>
              <tr><td>Price data</td><td style={{ color: 'var(--muted)' }}>Median + 30-day range</td><td style={{ color: 'var(--text)' }}>30 / 90 / 180-day + trend</td></tr>

              <tr><td className="category" colSpan={3}>Collection</td></tr>
              <tr><td>Vault (saved figures)</td><td style={{ color: 'var(--muted)' }}>25 figures</td><td><Check blue label="Unlimited" /></td></tr>
              <tr><td>Portfolio P&amp;L tracking</td><td style={{ color: 'var(--muted)' }}>Last 10</td><td><Check blue label="Unlimited" /></td></tr>
              <tr><td>Photo storage per figure</td><td style={{ color: 'var(--muted)' }}>1 photo</td><td><Check blue label="Unlimited" /></td></tr>
              <tr><td>Export to CSV / Excel</td><td><X /></td><td><Check blue /></td></tr>

              <tr><td className="category" colSpan={3}>Alerts &amp; Scanning</td></tr>
              <tr><td>Price alerts (watchlist)</td><td style={{ color: 'var(--muted)' }}>3 alerts</td><td><Check blue label="Unlimited" /></td></tr>
              <tr><td>Scout refresh interval</td><td style={{ color: 'var(--muted)' }}>24-hour</td><td style={{ color: 'var(--text)' }}>6-hour</td></tr>
              <tr><td>Arbitrage alerts</td><td><X /></td><td><Check blue /></td></tr>

              <tr><td className="category" colSpan={3}>Selling Tools</td></tr>
              <tr><td>List It (auto-listing helper)</td><td style={{ color: 'var(--muted)' }}>5/month</td><td><Check blue label="Unlimited" /></td></tr>
              <tr><td>Show Mode (Whatnot)</td><td><Check /></td><td><Check blue label="+ analytics &amp; bid suggestions" /></td></tr>

              <tr><td className="category" colSpan={3}>Experience</td></tr>
              <tr><td>Ad-free website</td><td><X /></td><td><Check blue /></td></tr>
              <tr><td>Pro badge</td><td><X /></td><td><Check blue /></td></tr>
              <tr><td>Support</td><td style={{ color: 'var(--muted)' }}>Community</td><td style={{ color: 'var(--text)' }}>Priority email</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '4rem 1rem', maxWidth: '640px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.04em', marginBottom: '2rem', textAlign: 'center' }}>
          COMMON QUESTIONS
        </h2>
        {FAQS.map(faq => (
          <div key={faq.q} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{faq.q}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.a}</div>
          </div>
        ))}
      </section>

      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.8rem' }}>
        © {new Date().getFullYear()} FigurePinner ·{' '}
        <a href="/privacy" style={{ color: 'var(--muted)' }}>Privacy</a> ·{' '}
        <a href="/terms" style={{ color: 'var(--muted)' }}>Terms</a>
      </footer>
    </main>
  )
}

function Check({ blue, label }: { blue?: boolean; label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: blue ? 'var(--blue)' : 'var(--green)' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6" fill="currentColor" fillOpacity="0.15" />
        <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{label}</span>}
    </span>
  )
}

function X() {
  return (
    <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>—</span>
  )
}

const FAQS = [
  {
    q: 'Is the free tier actually free forever?',
    a: 'Yes. No credit card required, no trial period, no expiry. Free FigurePinner is a real product — not a limited demo. Pro is for collectors who want more.',
  },
  {
    q: 'What\'s the difference between monthly and annual?',
    a: 'Monthly is $3.99/month. Annual is $29.99/year — that\'s 37% off, or less than the price of one figure for a full year of Pro.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings and you keep Pro access until the end of your billing period. No questions asked.',
  },
  {
    q: 'How do deal alerts work?',
    a: 'Set a target price for any figure in your watchlist. When eBay sold prices drop below your threshold, we send you an email immediately.',
  },
  {
    q: 'How accurate is the pricing data?',
    a: 'Prices are based on actual completed eBay sales — not list prices. We pull fresh data daily across 700K+ listings.',
  },
  {
    q: 'What happens when I hit the free vault limit?',
    a: 'At 20 figures (80% of your free 25), we\'ll let you know you\'re close. At 25, you\'ll need Pro to add more. You never lose existing items.',
  },
]
