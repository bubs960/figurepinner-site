import type { Metadata } from 'next'
import GenreTaxonomy from './_components/GenreTaxonomy'

export const metadata: Metadata = {
  title: 'FigurePinner — Action Figure Price Guide',
  description: 'Real eBay sold prices for 21,906+ action figures. Know what any figure is worth before you bid, buy, or sell.',
  alternates: { canonical: 'https://figurepinner.com' },
}

const W = '#EEEEF5'
const BG = '#09090F'
const SURFACE = '#141420'
const BORDER = 'rgba(255,255,255,0.08)'
const RED = '#e53238'

export default function HomePage() {
  return (
    <div style={{ background: BG, minHeight: '100vh', color: W, fontFamily: 'var(--font-body, system-ui)' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: '1rem', color: W, textDecoration: 'none' }}>
          FP <span>FigurePinner</span>
        </a>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="/guides" style={{ color: W, textDecoration: 'none', fontSize: '0.875rem' }}>Price Guide</a>
          <a href="/news" style={{ color: W, textDecoration: 'none', fontSize: '0.875rem' }}>News</a>
          <a href="/app/wantlist" style={{ color: W, textDecoration: 'none', fontSize: '0.875rem' }}>Wantlist</a>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/sign-in" style={{ color: W, textDecoration: 'none', fontSize: '0.875rem' }}>Log in</a>
          <a href="/sign-up" style={{
            background: W, color: BG, padding: '0.4rem 1rem',
            borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700,
          }}>Sign up free</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        textAlign: 'center', padding: '6rem 1.5rem 5rem',
        background: 'linear-gradient(180deg, #1a0a2e 0%, #09090F 70%)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          border: `1px solid ${BORDER}`, borderRadius: '999px',
          padding: '0.3rem 1rem', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.1em', color: W, marginBottom: '2rem',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          FREE · NO ACCOUNT REQUIRED TO BROWSE
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
          fontWeight: 900, lineHeight: 1.0, letterSpacing: '0.02em',
          textTransform: 'uppercase', color: W, margin: '0 auto 1.5rem',
          maxWidth: '780px',
        }}>
          Finally know what your collection is worth.
        </h1>

        <p style={{ fontSize: '1.1rem', color: W, lineHeight: 1.7, margin: '0 auto 1rem', maxWidth: '540px', opacity: 0.85 }}>
          Real eBay sold prices for 21,906+ action figures across 17 genres.
          Not estimates. Not asking prices. What figures actually sold for — yesterday.
        </p>
        <p style={{ fontSize: '0.95rem', color: W, lineHeight: 1.7, margin: '0 auto 2.5rem', maxWidth: '500px', opacity: 0.65 }}>
          See how close you are to finishing a wave. Track your grails. Know before you bid.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/search" style={{
            background: RED, color: W, padding: '0.9rem 2.25rem',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
            boxShadow: `0 0 28px ${RED}55`,
          }}>Look up a figure →</a>
          <a href="/sign-up" style={{
            background: SURFACE, border: `1px solid ${BORDER}`, color: W,
            padding: '0.9rem 2.25rem', borderRadius: '8px', textDecoration: 'none',
            fontWeight: 600, fontSize: '1rem',
          }}>Track your collection</a>
        </div>
      </section>

      {/* VALUE PROPS — tight, no icons */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {[
          { title: 'Real sold prices', body: 'Every number is a completed eBay sale. Median, last sold, 90-day average. No guessing.' },
          { title: 'Track your vault', body: 'Add figures to your collection. See your total value. Know how close you are to a complete wave.' },
          { title: 'Hunt smarter', body: 'Get alerts when a figure you want drops below market. Never overpay at a live show again.' },
        ].map(({ title, body }) => (
          <div key={title} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: W, marginBottom: '0.5rem' }}>{title}</div>
            <div style={{ fontSize: '0.875rem', color: W, lineHeight: 1.65, opacity: 0.8 }}>{body}</div>
          </div>
        ))}
      </section>

      {/* GENRE GRID */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem 1.5rem 5rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: W, opacity: 0.4, textAlign: 'center', marginBottom: '1.5rem' }}>
          Browse by genre
        </p>
        <GenreTaxonomy />
      </section>

      {/* SIGN UP CTA */}
      <section style={{ textAlign: 'center', padding: '3rem 1.5rem 5rem', borderTop: `1px solid ${BORDER}`, background: 'linear-gradient(180deg, transparent, rgba(26,10,46,0.4))' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: W, margin: '0 0 0.75rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Your grails have a price. Know it.</h2>
        <p style={{ color: W, opacity: 0.7, fontSize: '0.95rem', margin: '0 0 2rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          Free account. Track your vault, set price alerts, see your completion percentage.
        </p>
        <a href="/sign-up" style={{ background: W, color: BG, padding: '0.9rem 2.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>Create free account →</a>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {[['Price Guide', '/guides'], ['News', '/news'], ['Wantlist', '/app/wantlist'], ['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
            <a key={href} href={href} style={{ color: W, textDecoration: 'none', fontSize: '0.8rem', opacity: 0.5 }}>{label}</a>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: W, margin: 0, opacity: 0.35 }}>© 2026 Bubs960 Collectibles · FigurePinner</p>
      </footer>
    </div>
  )
}
