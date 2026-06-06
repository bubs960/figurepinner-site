import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Unsubscribed — FigurePinner',
  description: 'You have been unsubscribed from this deal alert.',
  robots: { index: false },
}

type PageProps = {
  searchParams: Promise<{ name?: string; error?: string }>
}

export default async function UnsubscribedPage({ searchParams }: PageProps) {
  const { name, error } = await searchParams
  const figureName = name ? decodeURIComponent(name) : null
  const isError = Boolean(error)
  const isExpired = error === 'expired'
  const isInvalid = error === 'invalid'

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)', padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center',
      }}>
        <a href="/" style={{
          fontFamily: 'var(--font-display)', fontSize: '1.125rem',
          letterSpacing: '0.04em', color: 'var(--text)', textDecoration: 'none',
        }}>
          FIGUREPINNER
        </a>
      </nav>

      {/* Content */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>

          {isError ? (
            <>
              {/* Error state */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <span style={{ fontSize: '1.75rem' }}>✕</span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem',
                letterSpacing: '0.04em', marginBottom: '0.875rem',
              }}>
                {isExpired ? 'LINK EXPIRED' : 'INVALID LINK'}
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: '1.7', marginBottom: '1.75rem' }}>
                {isExpired
                  ? 'This unsubscribe link has expired. Sign in to manage your alerts.'
                  : 'This link doesn\'t look right. Sign in to manage your alerts directly.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/sign-in?redirect_url=/app/alerts" style={{
                  display: 'inline-block', background: 'var(--blue)', color: '#fff',
                  textDecoration: 'none', padding: '0.625rem 1.25rem',
                  borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700',
                }}>
                  Manage Alerts
                </a>
                <a href="/" style={{
                  display: 'inline-block', background: 'var(--s1)', color: 'var(--muted)',
                  textDecoration: 'none', padding: '0.625rem 1.25rem',
                  borderRadius: '8px', fontSize: '0.875rem',
                  border: '1px solid var(--border)',
                }}>
                  Back to Home
                </a>
              </div>
            </>
          ) : (
            <>
              {/* Success state */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(0,200,112,0.1)', border: '1px solid rgba(0,200,112,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <span style={{ fontSize: '1.75rem' }}>✓</span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem',
                letterSpacing: '0.04em', marginBottom: '0.875rem',
              }}>
                UNSUBSCRIBED
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: '1.7', marginBottom: '1.75rem' }}>
                {figureName
                  ? <>You won't receive any more deal alerts for <strong style={{ color: 'var(--text)' }}>{figureName}</strong>.</>
                  : 'You won\'t receive any more alerts for this figure.'
                }
                {' '}You can re-enable it anytime from your alerts dashboard.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/sign-in?redirect_url=/app/alerts" style={{
                  display: 'inline-block', background: 'var(--blue)', color: '#fff',
                  textDecoration: 'none', padding: '0.625rem 1.25rem',
                  borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700',
                }}>
                  Manage Alerts
                </a>
                <a href="/search" style={{
                  display: 'inline-block', background: 'var(--s1)', color: 'var(--muted)',
                  textDecoration: 'none', padding: '0.625rem 1.25rem',
                  borderRadius: '8px', fontSize: '0.875rem',
                  border: '1px solid var(--border)',
                }}>
                  Browse Figures
                </a>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)', margin: 0 }}>
          © {new Date().getFullYear()} FigurePinner ·{' '}
          <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a> ·{' '}
          <a href="/terms"   style={{ color: 'var(--dim)' }}>Terms</a>
        </p>
      </footer>
    </div>
  )
}
