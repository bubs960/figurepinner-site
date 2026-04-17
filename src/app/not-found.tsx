// Custom 404 — shown for any unmatched route
export const runtime = 'edge'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', color: 'var(--text)', textDecoration: 'none' }}>
          FIGUREPINNER
        </a>
        <a href="/app" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Search figures →</a>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '4rem 1.5rem', textAlign: 'center',
      }}>
        {/* Big 404 */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(6rem, 20vw, 12rem)',
          letterSpacing: '0.04em', lineHeight: 1,
          color: 'var(--s3)', marginBottom: '1rem',
          userSelect: 'none',
        }}>
          404
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Figure Not Found
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: '400px', marginBottom: '2.5rem', fontSize: '0.9375rem' }}>
          This figure may have been retired, moved, or never existed — kind of like a Chase variant nobody admits to owning.
        </p>

        {/* Action links */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/app" style={{
            padding: '10px 20px', background: 'var(--blue)', borderRadius: '9999px',
            fontSize: '0.875rem', fontWeight: '600', color: '#fff', textDecoration: 'none',
          }}>
            Search Figures
          </a>
          <a href="/" style={{
            padding: '10px 20px', background: 'var(--s1)', border: '1px solid var(--border)',
            borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600',
            color: 'var(--muted)', textDecoration: 'none',
          }}>
            Back to Home
          </a>
        </div>

        {/* Genre shortcuts */}
        <div style={{ marginTop: '3rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>
            Browse by genre
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: '🤼 Wrestling',   href: '/wrestling' },
              { label: '🦸 Marvel',      href: '/marvel' },
              { label: '⚔️ Star Wars',   href: '/star-wars' },
              { label: '🤖 Transformers', href: '/transformers' },
              { label: '🦇 DC',          href: '/dc' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                style={{
                  padding: '5px 12px', background: 'var(--s1)', border: '1px solid var(--border)',
                  borderRadius: '9999px', fontSize: '0.8125rem', color: 'var(--muted)', textDecoration: 'none',
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
