import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Deal Alerts',
  robots: { index: false, follow: false },
}

const IS_PRO = false // TODO: derive from Clerk user metadata once billing is wired

const PLACEHOLDER_ALERTS = [
  { id: '1', name: 'Ultimate Warrior Defining Moments', line: 'Mattel Elite', target: 110, current: 145, triggered: false, created: '2026-03-12' },
  { id: '2', name: 'CM Punk Elite Return', line: 'Mattel Elite', target: 55, current: 52, triggered: true, created: '2026-02-28' },
]

export default function AlertsPage() {
  if (!IS_PRO) {
    return <ProGate />
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', marginBottom: '0.25rem' }}>
            DEAL ALERTS
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {PLACEHOLDER_ALERTS.length} active alerts
          </p>
        </div>
        <button style={{
          background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
          padding: '0.625rem 1.25rem', borderRadius: '7px', fontSize: '0.875rem',
          fontWeight: '600', fontFamily: 'var(--font-ui)',
        }}>
          + New Alert
        </button>
      </div>

      {PLACEHOLDER_ALERTS.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 90px 90px 100px 36px',
            padding: '0.5rem 1rem', gap: '1rem',
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--muted)', textTransform: 'uppercase',
          }}>
            <span>Figure</span>
            <span style={{ textAlign: 'right' }}>Target</span>
            <span style={{ textAlign: 'right' }}>Avg Now</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span />
          </div>

          {PLACEHOLDER_ALERTS.map(alert => (
            <div key={alert.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 90px 90px 100px 36px',
              padding: '0.875rem 1rem', gap: '1rem',
              background: 'var(--s1)',
              border: `1px solid ${alert.triggered ? 'rgba(0,200,112,0.3)' : 'var(--border)'}`,
              borderRadius: '8px', alignItems: 'center', fontSize: '0.875rem',
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text)' }}>{alert.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{alert.line}</div>
              </div>
              <span style={{ textAlign: 'right', color: 'var(--muted)' }}>${alert.target}</span>
              <span style={{ textAlign: 'right', fontWeight: '600' }}>${alert.current}</span>
              <div style={{ textAlign: 'center' }}>
                {alert.triggered ? (
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
                    background: 'rgba(0,200,112,0.12)', color: 'var(--green)',
                    fontSize: '0.75rem', fontWeight: '700',
                  }}>
                    ✓ Triggered
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
                    background: 'rgba(255,255,255,0.06)', color: 'var(--muted)',
                    fontSize: '0.75rem', fontWeight: '600',
                  }}>
                    Watching
                  </span>
                )}
              </div>
              <button style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '5px',
                color: 'var(--muted)', cursor: 'pointer', padding: '4px 6px',
                fontSize: '0.75rem', fontFamily: 'var(--font-ui)',
              }}>
                ···
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProGate() {
  return (
    <div style={{ maxWidth: '560px', margin: '4rem auto', textAlign: 'center' }}>
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem 2rem',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔔</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
          DEAL ALERTS
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Set a target price for any figure. When eBay sold prices drop to your target, we&apos;ll email you immediately — so you can buy before the deal disappears.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem', textAlign: 'left' }}>
          {[
            'Email alert within minutes of price drop',
            'Unlimited alerts across all genres',
            'Works on any figure in our 20K+ database',
            'Pause or delete alerts anytime',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem' }}>
              <CheckIcon /> {f}
            </div>
          ))}
        </div>

        <a href="/pro" style={{
          display: 'block', background: 'var(--blue)', color: '#fff',
          padding: '0.875rem', borderRadius: '8px', fontSize: '1rem',
          fontWeight: '700', textDecoration: 'none', marginBottom: '0.625rem',
        }}>
          Unlock Alerts — $6.99/mo
        </a>
        <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Cancel anytime. Includes all Pro features.</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '4rem 2rem',
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔔</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        NO ACTIVE ALERTS
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
        Set a price alert on any figure and we&apos;ll notify you when it drops.
      </p>
      <button style={{
        background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
        padding: '0.625rem 1.5rem', borderRadius: '7px', fontSize: '0.875rem',
        fontWeight: '600', fontFamily: 'var(--font-ui)',
      }}>
        + Create Alert
      </button>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--green)' }}>
      <circle cx="7" cy="7" r="6" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
