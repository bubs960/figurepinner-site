'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

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

// Wantlist is unlimited for all users per pricing doc — no cap
// Vault has a 25-figure free limit; alerts have a 3-alert free limit

const GENRE_EMOJI: Record<string, string> = {
  'wrestling': '🤼', 'marvel': '🦸', 'star-wars': '⚔️', 'dc': '🦇',
  'transformers': '🤖', 'gijoe': '🪖', 'masters-of-the-universe': '⚡',
  'teenage-mutant-ninja-turtles': '🐢', 'power-rangers': '🦕',
  'indiana-jones': '🎩', 'ghostbusters': '👻', 'mythic-legions': '🗡️',
  'thundercats': '🐱', 'action-force': '🎖️', 'dungeons-dragons': '🐉',
  'neca': '🎬', 'spawn': '🦇',
}

export default function WantlistPage() {
  const [items, setItems] = useState<WantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { user, isLoaded } = useUser()
  const IS_PRO = isLoaded ? ((user?.publicMetadata?.isPro as boolean) ?? false) : false

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

  async function updateTargetPrice(id: string, target_price: number) {
    await fetch(`/api/wantlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_price }),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, target_price } : i))
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
            {loading ? '—' : `${items.length} figure${items.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>
        <button
          disabled
          title="Search for a figure and click Add to Want List from its detail page"
          style={{
            background: 'var(--s2)', color: 'var(--muted)',
            border: 'none', cursor: 'not-allowed',
            padding: '0.625rem 1.25rem', borderRadius: '7px',
            fontSize: '0.875rem', fontWeight: '600', fontFamily: 'var(--font-ui)',
            opacity: 0.5,
          }}
        >
          + Add Figure
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 130px 36px',
            padding: '0.5rem 1rem', gap: '1rem',
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--muted)', textTransform: 'uppercase',
          }}>
            <span>Figure</span>
            <span style={{ textAlign: 'right' }}>Target Price</span>
            <span />
          </div>

          {items.map(item => (
            <WantRow
              key={item.id}
              item={item}
              deleting={deleting === item.id}
              onRemove={() => removeItem(item.id)}
              onUpdatePrice={(price) => updateTargetPrice(item.id, price)}
            />
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
        Search for a figure and click &ldquo;Add to Want List&rdquo; from its detail page.
        Click a target price to edit it inline.
      </p>
    </div>
  )
}

function WantRow({
  item, deleting, onRemove, onUpdatePrice,
}: {
  item: WantItem
  deleting: boolean
  onRemove: () => void
  onUpdatePrice: (price: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(item.target_price ?? ''))

  function commit() {
    setEditing(false)
    const num = parseFloat(value)
    if (!isNaN(num) && num !== item.target_price) {
      onUpdatePrice(num)
    }
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 130px 36px',
      padding: '0.875rem 1rem', gap: '1rem',
      background: 'var(--s1)', border: '1px solid var(--border)',
      borderRadius: '8px', alignItems: 'center', fontSize: '0.875rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }} title={item.genre ?? undefined}>
          {GENRE_EMOJI[item.genre ?? ''] ?? '🤼'}
        </span>
        <div style={{ minWidth: 0 }}>
          <a
            href={`/figure/${item.figure_id}`}
            style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
          >
            {item.name}
          </a>
          {item.line && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{item.line}</div>
          )}
        </div>
      </div>

      {editing ? (
        <input
          type="number"
          value={value}
          min="0"
          step="0.01"
          autoFocus
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setValue(String(item.target_price ?? '')) } }}
          style={{
            background: 'var(--s2)', border: '1px solid var(--blue)',
            borderRadius: '5px', color: 'var(--text)', fontSize: '0.85rem',
            padding: '3px 6px', fontFamily: 'var(--font-body)',
            width: '100%', textAlign: 'right', outline: 'none',
          }}
        />
      ) : (
        <button
          onClick={() => { setEditing(true); setValue(String(item.target_price ?? '')) }}
          title="Click to edit target price"
          style={{
            textAlign: 'right', color: item.target_price ? 'var(--text)' : 'var(--muted)',
            fontWeight: item.target_price ? '600' : '400',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 0', fontSize: '0.875rem', fontFamily: 'var(--font-body)', width: '100%',
          }}
        >
          {item.target_price ? `$${item.target_price}` : '—'}
        </button>
      )}

      <button
        onClick={onRemove}
        disabled={deleting}
        style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: '5px',
          color: 'var(--muted)', cursor: 'pointer', padding: '4px 6px',
          fontSize: '0.75rem', fontFamily: 'var(--font-ui)',
          opacity: deleting ? 0.4 : 1,
        }}
      >
        ✕
      </button>
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
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
        Search for a figure and open its detail page to add it to your want list.
      </p>
      <a href="/app" style={{
        display: 'inline-block', background: 'var(--blue)', color: '#fff', textDecoration: 'none',
        padding: '0.625rem 1.5rem', borderRadius: '7px', fontSize: '0.875rem', fontWeight: '600',
      }}>
        Search Figures
      </a>
    </div>
  )
}
