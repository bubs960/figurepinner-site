import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'FigurePinner Pro — Serious Collectors Only',
  description: 'Get deal alerts, full price history, and unlimited want list tracking for $6.99/month.',
}

const FREE_FEATURES = [
  'Search 20,000+ figures',
  'Current market price (avg)',
  'eBay sold listings link',
  'Browse by genre',
  '10 want list slots',
]

const PRO_FEATURES = [
  { label: 'Everything in Free', highlight: false },
  { label: 'Full 90-day price history charts', highlight: true },
  { label: 'Deal alerts — get pinged when price drops', highlight: true },
  { label: 'Unlimited want list', highlight: true },
  { label: 'Series completion tracker', highlight: true },
  { label: 'Whatnot live deal scanner', highlight: true },
  { label: 'Early access to new genres', highlight: false },
  { label: 'No ads', highlight: false },
]

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
      <section style={{ textAlign: 'center', padding: '5rem 1rem 3rem', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(0,102,255,0.15)', color: 'var(--blue)',
          fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em',
          padding: '0.375rem 0.875rem', borderRadius: '100px', marginBottom: '1.25rem',
          border: '1px solid rgba(0,102,255,0.3)',
        }}>
          FIGUREPINNER PRO
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          letterSpacing: '0.03em', lineHeight: 1.05, margin: '0 0 1rem',
        }}>
          FOR COLLECTORS WHO<br />
          <span style={{ color: 'var(--blue)' }}>HUNT SERIOUSLY</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.6, margin: '0 0 2.5rem' }}>
          Deal alerts, price history, and unlimited tracking — everything you need to buy at the right price and never miss a flip.
        </p>
        <a href="/sign-up?plan=pro" style={{
          display: 'inline-block', background: 'var(--blue)', color: '#fff',
          padding: '0.875rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '700',
          textDecoration: 'none', letterSpacing: '0.02em',
        }}>
          Start Free Trial — $6.99/mo
        </a>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
          Cancel anytime. No credit card to start.
        </p>
      </section>

      {/* Pricing table */}
      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem 5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Free card */}
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem' }}>FREE</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>$0</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Forever free. No card needed.</div>
          <a href="/sign-up" style={{
            display: 'block', textAlign: 'center', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '0.625rem', borderRadius: '6px', fontSize: '0.875rem',
            fontWeight: '600', textDecoration: 'none', marginBottom: '1.75rem',
          }}>
            Create Free Account
          </a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                <CheckIcon /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Pro card */}
        <div style={{
          background: 'var(--s1)', border: '2px solid var(--blue)', borderRadius: '12px', padding: '2rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'var(--blue)', color: '#fff', fontSize: '0.7rem', fontWeight: '700',
            letterSpacing: '0.08em', padding: '0.25rem 0.625rem', borderRadius: '100px',
          }}>
            MOST POPULAR
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--blue)', marginBottom: '0.5rem' }}>PRO</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>$6.99</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>per month, cancel anytime</div>
          <a href="/sign-up?plan=pro" style={{
            display: 'block', textAlign: 'center', background: 'var(--blue)',
            color: '#fff', padding: '0.625rem', borderRadius: '6px', fontSize: '0.875rem',
            fontWeight: '700', textDecoration: 'none', marginBottom: '1.75rem',
          }}>
            Start Free Trial
          </a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {PRO_FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: f.highlight ? 'var(--text)' : 'var(--muted)' }}>
                <CheckIcon color={f.highlight ? 'var(--green)' : undefined} /> {f.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ strip */}
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
        © {new Date().getFullYear()} FigurePinner · <a href="/privacy" style={{ color: 'var(--muted)' }}>Privacy</a>
      </footer>
    </main>
  )
}

function CheckIcon({ color = 'var(--green)' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color }}>
      <circle cx="7" cy="7" r="6" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const FAQS = [
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards via Stripe. No PayPal at this time.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings and you keep Pro access until the end of your billing period.',
  },
  {
    q: 'How do deal alerts work?',
    a: 'Set a target price for any figure in your want list. When eBay sold prices drop below your threshold, we send you an email immediately.',
  },
  {
    q: 'How accurate is the pricing data?',
    a: 'Prices are based on actual completed eBay sales — not list prices. We pull fresh data daily across 700K+ listings.',
  },
]
