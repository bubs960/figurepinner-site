'use client'
// not-found.tsx must be a client component — @cloudflare/next-on-pages
// does not support runtime exports on the not-found route.

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#09090F', color: '#EEEEF5',
      fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid #1E2130',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.25rem', letterSpacing: '0.04em', color: '#EEEEF5', textDecoration: 'none' }}>
          FIGUREPINNER
        </a>
        <a href="/app" style={{ fontSize: '0.875rem', color: '#666E8A', textDecoration: 'none' }}>Search figures →</a>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '4rem 1.5rem', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 'clamp(6rem, 20vw, 12rem)',
          letterSpacing: '0.04em', lineHeight: 1,
          color: '#1E2130', marginBottom: '1rem',
          userSelect: 'none',
        }}>
          404
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Figure Not Found
        </h1>
        <p style={{ color: '#666E8A', maxWidth: '400px', marginBottom: '2.5rem', fontSize: '0.9375rem' }}>
          This figure may have been retired, moved, or never existed — kind of like a Chase variant nobody admits to owning.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/app" style={{
            padding: '10px 20px', background: '#0066FF', borderRadius: '9999px',
            fontSize: '0.875rem', fontWeight: '600', color: '#fff', textDecoration: 'none',
          }}>
            Search Figures
          </a>
          <a href="/" style={{
            padding: '10px 20px', background: '#111318', border: '1px solid #1E2130',
            borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600',
            color: '#666E8A', textDecoration: 'none',
          }}>
            Back to Home
          </a>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#3A3D52', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>
            Browse by genre
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: '🤼 Wrestling',    href: '/wrestling' },
              { label: '🦸 Marvel',       href: '/marvel' },
              { label: '⚔️ Star Wars',    href: '/star-wars' },
              { label: '🤖 Transformers', href: '/transformers' },
              { label: '🦇 DC',           href: '/dc' },
            ].map(({ label, href }) => (
              <a key={href} href={href} style={{
                padding: '5px 12px', background: '#111318', border: '1px solid #1E2130',
                borderRadius: '9999px', fontSize: '0.8125rem', color: '#666E8A', textDecoration: 'none',
              }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
