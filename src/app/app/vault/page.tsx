'use client'

import { useState, useEffect } from 'react'

type VaultItem = {
  id: string
  figure_id: string
  name: string
  brand: string | null
  line: string | null
  genre: string | null
  paid: number
  condition: string
  added_at: string
}

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/vault')
      .then(r => r.json())
      .then((d: { items: VaultItem[] }) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  async function removeItem(id: string) {
    setDeleting(id)
    await fetch(`/api/vault/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  // Prices stored as cents in DB — but for now treat as dollars since we're inserting dollar values
  const totalPaid = items.reduce((s, i) => s + (i.paid ?? 0), 0)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', marginBottom: '0.25rem' }}>
            MY COLLECTION
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {loading ? '—' : `${items.length} figures tracked`}
          </p>
        </div>
        <button
          style={{
            background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
            padding: '0.625rem 1.25rem', borderRadius: '7px', fontSize: '0.875rem',
            fontWeight: '600', fontFamily: 'var(--font-ui)',
            opacity: 0.5,
          }}
          title="Search for a figure and click Add to Collection"
        >
          + Add Figure
        </button>
      </div>

      {/* Summary stats */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
          <SummaryCard label="FIGURES" value={String(items.length)} />
          <SummaryCard label="TOTAL PAID" value={`$${totalPaid}`} highlight />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 90px 36px',
            padding: '0.5rem 1rem', gap: '1rem',
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--muted)', textTransform: 'uppercase',
          }}>
            <span>Figure</span>
            <span>Condition</span>
            <span style={{ textAlign: 'right' }}>Paid</span>
            <span />
          </div>

          {items.map(item => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 90px 36px',
                padding: '0.875rem 1rem',
                gap: '1rem',
                background: 'var(--s1)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                alignItems: 'center',
                fontSize: '0.875rem',
              }}
            >
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
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                fontSize: '0.75rem', fontWeight: '600', width: 'fit-content',
                background: item.condition === 'MOC' ? 'rgba(0,200,112,0.12)' : 'rgba(255,255,255,0.06)',
                color: item.condition === 'MOC' ? 'var(--green)' : 'var(--muted)',
              }}>
                {item.condition}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--muted)' }}>
                {item.paid ? `$${item.paid}` : '—'}
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

      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--dim, #3A3D52)' }}>
        To add figures: search for a figure, open its detail page, and click &ldquo;Add to Collection&rdquo;.
      </p>
    </div>
  )
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      background: 'var(--s1)', border: `1px solid ${highlight ? 'var(--blue)' : 'var(--border)'}`,
      borderRadius: '10px', padding: '1rem 1.25rem',
    }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.375rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.02em', color: 'var(--text)' }}>
        {value}
      </div>
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
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        YOUR VAULT IS EMPTY
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto' }}>
        Search for a figure and open its detail page to add it to your collection.
      </p>
    </div>
  )
}
