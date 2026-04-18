'use client'

import { useState, useEffect } from 'react'

type WantItem = {
  id: string
  figure_id: string
  name: string
  brand: string | null
  line: string | null
  genre: string | null
  target_price: number
  added_at: string
}

const FREE_LIMIT = 10

export default function WantlistPage() {
  const [items, setItems] = useState<WantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // IS_PRO — hardcoded false until Clerk publicMetadata billing is wired
  const IS_PRO = false
  const atLimit = !IS_PRO && items.length >= FREE_LIMIT

  useEffect(() => {
    fetch('/api/wantlist')
      .then(r => r.json())
      .then((d: { items: WantItem[] }) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  async function removeItem(id: string) {
    setDeleting(id)
    await fetch(`/api/wantlist/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', marginBottom: '0.25rem' }}>
            WANT LIST
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {loading ? '—' : `${items.length}${!IS_PRO ? ` / ${FREE_LIMIT}` : ''} figures`}
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
            title="Search for a figure and click Add to Want List"
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

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 36px',
            padding: '0.5rem 1rem', gap: '1rem',
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--muted)', textTransform: 'uppercase',
          }}>
            <span>Figure</span>
            <span style={{ textAlign: 'right' }}>Target Price</span>
            <span />
          </div>

          {items.map(item => (
            <div key={item.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 110px 36px',
              padding: '0.875rem 1rem', gap: '1rem',
              background: 'var(--s1)', border: '1px solid var(--border)',
              borderRadius: '8px', alignItems: 'center', fontSize: '0.875rem',
            }}>
              <div>
                <a
                  href={`/figure/${item.figure_id}`}
                  style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}
                >
                  {item.name}
                </a>
                {item.line && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{item.line}</div>
                )}
              </div>
              <span style={{ textAlign: 'right', color: 'var(--muted)' }}>
                {item.target_price ? `$${item.target_price}` : '—'}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                disabled={deleting === item.id}
                style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: '5px',
                  color: 'var(--muted)', cursor: 'pointer', padding: '4px 6px',
                  fontSize: '0.75rem', fontFamily: 'var(--font-ui)',
                  opacity: deleting === item.id ? 0.4 : 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pro upsell */}
      {!IS_PRO && items.length > 0 && (
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

      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--dim, #3A3D52)' }}>
        To add figures: search for a figure, open its detail page, and click &ldquo;Add to Want List&rdquo;.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: '60px', background: 'var(--s1)', border: '1px solid var(--border)',
          borderRadius: '8px', opacity: 0.5,
        }} />
      ))}
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
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto' }}>
        Search for a figure and open its detail page to add it to your want list.
      </p>
    </div>
  )
}
