'use client'

import { useState, useEffect, useRef } from 'react'

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

const CONDITIONS = ['Loose', 'Near Mint', 'MOC', 'Opened', 'Damaged']

const GENRE_EMOJI: Record<string, string> = {
  'wrestling': '🤼', 'marvel': '🦸', 'star-wars': '⚔️', 'dc': '🦇',
  'transformers': '🤖', 'gijoe': '🪖', 'masters-of-the-universe': '⚡',
  'teenage-mutant-ninja-turtles': '🐢', 'power-rangers': '🦕',
  'indiana-jones': '🎩', 'ghostbusters': '👻', 'mythic-legions': '🗡️',
  'thundercats': '🐱', 'action-force': '🎖️', 'dungeons-dragons': '🐉',
  'neca': '🎬', 'spawn': '🦇',
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

  async function updateItem(id: string, patch: { paid?: number; condition?: string }) {
    await fetch(`/api/vault/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

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
            {loading ? '—' : `${items.length} figure${items.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>
        <button
          style={{
            background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
            padding: '0.625rem 1.25rem', borderRadius: '7px', fontSize: '0.875rem',
            fontWeight: '600', fontFamily: 'var(--font-ui)', opacity: 0.5,
          }}
          title="Search for a figure and click Add to Collection"
        >
          + Add Figure
        </button>
      </div>

      {/* Summary stats */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
          <SummaryCard label="FIGURES" value={String(items.length)} />
          <SummaryCard label="TOTAL PAID" value={`$${totalPaid}`} highlight />
          <SummaryCard
            label="AVG PAID"
            value={items.length ? `$${Math.round(totalPaid / items.length)}` : '—'}
          />
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
            display: 'grid', gridTemplateColumns: '1fr 140px 100px 36px',
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
            <VaultRow
              key={item.id}
              item={item}
              deleting={deleting === item.id}
              onRemove={() => removeItem(item.id)}
              onUpdate={(patch) => updateItem(item.id, patch)}
            />
          ))}
        </div>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--dim, #3A3D52)' }}>
        Search for a figure and click &ldquo;Add to Collection&rdquo; from its detail page.
        Click any value to edit it inline.
      </p>
    </div>
  )
}

function VaultRow({
  item, deleting, onRemove, onUpdate,
}: {
  item: VaultItem
  deleting: boolean
  onRemove: () => void
  onUpdate: (patch: { paid?: number; condition?: string }) => void
}) {
  const [editingPaid, setEditingPaid] = useState(false)
  const [editingCondition, setEditingCondition] = useState(false)
  const [paidValue, setPaidValue] = useState(String(item.paid ?? ''))
  const paidInputRef = useRef<HTMLInputElement>(null)

  function commitPaid() {
    setEditingPaid(false)
    const num = parseFloat(paidValue)
    if (!isNaN(num) && num !== item.paid) {
      onUpdate({ paid: num })
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 140px 100px 36px',
        padding: '0.875rem 1rem',
        gap: '1rem',
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        alignItems: 'center',
        fontSize: '0.875rem',
      }}
    >
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

      {/* Condition — click to cycle or select */}
      {editingCondition ? (
        <select
          autoFocus
          value={item.condition}
          onChange={e => { onUpdate({ condition: e.target.value }); setEditingCondition(false) }}
          onBlur={() => setEditingCondition(false)}
          style={{
            background: 'var(--s2)', border: '1px solid var(--blue)',
            borderRadius: '5px', color: 'var(--text)', fontSize: '0.75rem',
            padding: '3px 6px', fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}
        >
          {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <button
          onClick={() => setEditingCondition(true)}
          title="Click to change condition"
          style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
            fontSize: '0.75rem', fontWeight: '600', width: 'fit-content',
            background: item.condition === 'MOC' ? 'rgba(0,200,112,0.12)' : 'rgba(255,255,255,0.06)',
            color: item.condition === 'MOC' ? 'var(--green)' : 'var(--muted)',
            border: 'none', cursor: 'pointer',
          }}
        >
          {item.condition}
        </button>
      )}

      {/* Paid — click to edit */}
      {editingPaid ? (
        <input
          ref={paidInputRef}
          type="number"
          value={paidValue}
          min="0"
          step="0.01"
          autoFocus
          onChange={e => setPaidValue(e.target.value)}
          onBlur={commitPaid}
          onKeyDown={e => { if (e.key === 'Enter') commitPaid(); if (e.key === 'Escape') { setEditingPaid(false); setPaidValue(String(item.paid ?? '')) } }}
          style={{
            background: 'var(--s2)', border: '1px solid var(--blue)',
            borderRadius: '5px', color: 'var(--text)', fontSize: '0.85rem',
            padding: '3px 6px', fontFamily: 'var(--font-body)',
            width: '100%', textAlign: 'right', outline: 'none',
          }}
        />
      ) : (
        <button
          onClick={() => { setEditingPaid(true); setPaidValue(String(item.paid ?? '')) }}
          title="Click to edit price"
          style={{
            textAlign: 'right', color: 'var(--muted)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 0', fontSize: '0.875rem',
            fontFamily: 'var(--font-body)', width: '100%',
          }}
        >
          {item.paid ? `$${item.paid}` : '—'}
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
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
        Search for a figure and open its detail page to add it to your collection.
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
