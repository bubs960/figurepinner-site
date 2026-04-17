import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Want List',
  robots: { index: false, follow: false },
}

const IS_PRO = false // TODO: derive from Clerk user metadata once billing is wired

const PLACEHOLDER_WANTS = [
  { id: '1', name: 'Ultimate Warrior Defining Moments', line: 'Mattel Elite', genre: 'wrestling', slug: 'ultimate-warrior-defining-moments', avg_price: 145, target_price: 110, delta: -24 },
  { id: '2', name: 'Hulk Hogan Elite Wave 1', line: 'Mattel Elite', genre: 'wrestling', slug: 'hulk-hogan-elite-wave-1', avg_price: 89, target_price: 75, delta: -15 },
  { id: '3', name: 'Andre the Giant Elite', line: 'Mattel Elite', genre: 'wrestling', slug: 'andre-the-giant-elite', avg_price: 62, target_price: 62, delta: 0 },
  { id: '4', name: 'Jake the Snake Roberts Elite', line: 'Mattel Elite', genre: 'wrestling', slug: 'jake-the-snake-elite', avg_price: 38, target_price: 50, delta: 24 },
]

const FREE_LIMIT = 10

export default function WantlistPage() {
  const atLimit = !IS_PRO && PLACEHOLDER_WANTS.length >= FREE_LIMIT

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', marginBottom: '0.25rem' }}>
            WANT LIST
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {PLACEHOLDER_WANTS.length}{!IS_PRO ? ` / ${FREE_LIMIT}` : ''} figures
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {!IS_PRO && (
            <a href="/pro" style={{ fontSize: '0.8rem', color: 'var(--blue)', textDecoration: 'none', fontWeight: '500' }}>
              Upgrade for unlimited →
            </a>
          )}
          <button
            disabled={atLimit}
            style={{
              background: atLimit ? 'var(--s2)' : 'var(--blue)',
              color: atLimit ? 'var(--muted)' : '#fff',
              border: 'none', cursor: atLimit ? 'not-allowed' : 'pointer',
              padding: '0.625rem 1.25rem', borderRadius: '7px',
              fontSize: '0.875rem', fontWeight: '600', fontFamily: 'var(--font-ui)',
            }}
          >
            + Add Figure
          </button>
        </div>
      </div>

      {/* Free tier limit warning */}
      {atLimit && (
        <div style={{
          background: 'rgba(255,95,0,0.08)', border: '1px solid rgba(255,95,0,0.25)',
          borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
            You&apos;ve hit the {FREE_LIMIT}-figure free limit.
          </span>
          <a href="/pro" style={{
            background: 'var(--orange)', color: '#fff', textDecoration: 'none',
            padding: '0.375rem 0.875rem', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
          }}>
            Go Pro — $6.99/mo
          </a>
        </div>
      )}

      {/* Empty state */}
      {PLACEHOLDER_WANTS.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 100px 90px 36px',
            padding: '0.5rem 1rem', gap: '1rem',
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--muted)', textTransform: 'uppercase',
          }}>
            <span>Figure</span>
            <span style={{ textAlign: 'right' }}>Target</span>
            <span style={{ textAlign: 'right' }}>Avg Now</span>
            <span style={{ textAlign: 'right' }}>Delta</span>
            <span />
          </div>

          {PLACEHOLDER_WANTS.map(item => {
            const below = item.avg_price <= item.target_price
            return (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 100px 90px 36px',
                padding: '0.875rem 1rem', gap: '1rem',
                background: 'var(--s1)', border: `1px solid ${below ? 'rgba(0,200,112,0.2)' : 'var(--border)'}`,
                borderRadius: '8px', alignItems: 'center', fontSize: '0.875rem',
              }}>
                <div>
                  <a
                    href={`/${item.genre}/mattel-elite/${item.slug}`}
                    style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}
                  >
                    {item.name}
                  </a>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{item.line}</div>
                </div>
                <span style={{ textAlign: 'right', color: 'var(--muted)' }}>${item.target_price}</span>
                <span style={{ textAlign: 'right', fontWeight: '600' }}>${item.avg_price}</span>
                <span style={{
                  textAlign: 'right', fontWeight: '700',
                  color: below ? 'var(--green)' : item.delta > 0 ? '#FF4444' : 'var(--muted)',
                }}>
                  {below ? '✓ At target' : item.delta > 0 ? `+$${item.delta}` : `$${item.delta}`}
                </span>
                <button style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: '5px',
                  color: 'var(--muted)', cursor: 'pointer', padding: '4px 6px',
                  fontSize: '0.75rem', fontFamily: 'var(--font-ui)',
                }}>
                  ···
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Pro upsell for alerts */}
      {!IS_PRO && PLACEHOLDER_WANTS.length > 0 && (
        <div style={{
          marginTop: '1.5rem', padding: '1.25rem', background: 'var(--s1)',
          border: '1px solid var(--border)', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>🔔 Get notified when prices drop</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Pro members get email alerts when any want list figure hits their target.</div>
          </div>
          <a href="/pro" style={{
            background: 'var(--blue)', color: '#fff', textDecoration: 'none',
            padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem',
            fontWeight: '700', flexShrink: 0,
          }}>
            Unlock Alerts
          </a>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '4rem 2rem',
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        WANT LIST IS EMPTY
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
        Add figures you&apos;re hunting. We&apos;ll track the price and alert you when it drops.
      </p>
      <button style={{
        background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
        padding: '0.625rem 1.5rem', borderRadius: '7px', fontSize: '0.875rem',
        fontWeight: '600', fontFamily: 'var(--font-ui)',
      }}>
        + Add First Figure
      </button>
    </div>
  )
}
