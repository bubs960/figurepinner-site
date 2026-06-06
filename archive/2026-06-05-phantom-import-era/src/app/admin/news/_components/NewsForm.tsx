'use client'

import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const GENRES = [
  '', 'wrestling', 'marvel', 'star-wars', 'dc', 'transformers',
  'gijoe', 'masters-of-the-universe', 'teenage-mutant-ninja-turtles',
  'power-rangers', 'indiana-jones', 'ghostbusters', 'mythic-legions',
  'thundercats', 'action-force', 'dungeons-dragons', 'neca', 'spawn',
] as const

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--s2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
  fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700,
  letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--muted)', marginBottom: 6,
}

export default function NewsForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [lastId, setLastId] = useState<string>('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = new FormData(form)

    const payload: Record<string, unknown> = {
      title: String(data.get('title') ?? '').trim(),
      body: String(data.get('body') ?? '').trim() || undefined,
      url: String(data.get('url') ?? '').trim() || undefined,
      genre: String(data.get('genre') ?? '').trim() || undefined,
      figure_id: String(data.get('figure_id') ?? '').trim() || undefined,
      pinned: data.get('pinned') === 'on',
    }
    const pubAt = String(data.get('published_at') ?? '').trim()
    if (pubAt) {
      // Convert datetime-local (no TZ) to ISO so server stores it as UTC.
      // datetime-local gives "2026-04-25T15:30" (no seconds/TZ).
      payload.published_at = new Date(pubAt).toISOString()
    }

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { id?: string; error?: string }
      if (res.ok && json.id) {
        setStatus('success')
        setLastId(json.id)
        form.reset()
        // Re-fetch the recent list by reloading after a short delay so the
        // server component re-renders with the new entry.
        setTimeout(() => window.location.reload(), 800)
      } else {
        setStatus('error')
        setErrorMsg(json.error ?? `HTTP ${res.status}`)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Request failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--s1)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '1.5rem', display: 'flex',
      flexDirection: 'column', gap: '1rem',
    }}>
      <div>
        <label style={labelStyle} htmlFor="news-title">Title *</label>
        <input
          id="news-title" name="title" type="text" required maxLength={200}
          placeholder="Mattel announces WWE Elite Series 110 for Q3 release"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="news-body">Body (optional)</label>
        <textarea
          id="news-body" name="body" rows={4}
          placeholder="Short description, markdown allowed."
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle} htmlFor="news-url">Source URL (optional)</label>
          <input
            id="news-url" name="url" type="url"
            placeholder="https://..."
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="news-genre">Genre (optional)</label>
          <select id="news-genre" name="genre" defaultValue="" style={inputStyle}>
            {GENRES.map((g) => (
              <option key={g || 'none'} value={g}>{g || '— none / cross-genre —'}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle} htmlFor="news-figure">Figure ID (optional)</label>
          <input
            id="news-figure" name="figure_id" type="text"
            placeholder="fp_wrestling_..."
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="news-published">Published at (optional)</label>
          <input
            id="news-published" name="published_at" type="datetime-local"
            style={inputStyle}
          />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text)', cursor: 'pointer' }}>
        <input type="checkbox" name="pinned" />
        <span>📌 Pin to top of /news</span>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            background: status === 'submitting' ? 'var(--s2)' : 'var(--blue)',
            color: status === 'submitting' ? 'var(--muted)' : '#fff',
            border: 'none', borderRadius: 8,
            padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: 700,
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {status === 'submitting' ? 'Posting…' : 'Post Event'}
        </button>

        {status === 'success' && (
          <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>
            ✓ Posted ({lastId.slice(0, 8)}…). Reloading…
          </span>
        )}
        {status === 'error' && (
          <span style={{ color: '#E5484D', fontSize: '0.85rem', fontWeight: 600 }}>
            ✗ {errorMsg}
          </span>
        )}
      </div>
    </form>
  )
}
