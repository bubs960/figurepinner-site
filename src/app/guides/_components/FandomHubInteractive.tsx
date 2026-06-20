'use client'

/**
 * FandomHubInteractive — the client-side funnel tools for a FandomHub.
 * Renders the "intel" comp table with (1) line-filter pills, (2) an on-hub
 * "is it worth it?" price-checker hitting /api/v1/price-check, (3) hover
 * stat-peek on each row. Everything funnels to /figure/ pages — engagement
 * is the funnel, not decoration (Steve 6/20). Voice strings come from the
 * theme's VoicePack so each fandom speaks its own language.
 *
 * Server <FandomHub> passes plain serializable props; this owns interactivity.
 */

import { useState, useMemo } from 'react'

export type TopComp = {
  figure_id: string
  name: string
  line: string
  price: number
  sold_count: number
  last_sold: string | null
  flag: string
  url: string
}

type FlagWording = { vintage?: string; motuc?: string; exclusive?: string; reissue?: string }
type Voice = {
  intelHeader: string
  intelSub: string
  emptyState: string
  searchPlaceholder: string
  ctaLabel: string
  flag: FlagWording
}

function flagLabel(flag: string, fw: FlagWording): string {
  if (flag === 'VINTAGE') return fw.vintage ?? 'VINTAGE'
  if (flag === 'MOTUC') return fw.motuc ?? 'CLASSICS'
  if (flag === 'EXCLUSIVE') return fw.exclusive ?? 'EXCLUSIVE'
  if (flag === 'REISSUE') return fw.reissue ?? 'REISSUE'
  return ''
}

type CheckResult =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'hit'; name: string; brand: string; line: string; price: number | null; sample: number; url?: string }
  | { state: 'miss' }
  | { state: 'error' }

export default function FandomHubInteractive({
  figures,
  generatedAt,
  voice,
}: {
  figures: TopComp[]
  generatedAt: string
  voice: Voice
}) {
  const lines = useMemo(() => {
    const set = new Set(figures.map(f => f.line).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [figures])

  const [activeLine, setActiveLine] = useState('All')
  const shown = activeLine === 'All' ? figures : figures.filter(f => f.line === activeLine)

  // ── On-hub price checker ─────────────────────────────────────────────
  const [q, setQ] = useState('')
  const [result, setResult] = useState<CheckResult>({ state: 'idle' })

  async function check(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (query.length < 2) return
    setResult({ state: 'loading' })
    try {
      const res = await fetch(`/api/v1/price-check?q=${encodeURIComponent(query)}`)
      if (!res.ok) { setResult({ state: 'miss' }); return }
      const d = await res.json()
      if (!d.match) { setResult({ state: 'miss' }); return }
      setResult({
        state: 'hit',
        name: d.match.name,
        brand: d.match.brand,
        line: d.match.line,
        price: d.median_price,
        sample: d.sample_size ?? 0,
        url: d.match.fid ? `/figure/${d.match.fid}` : undefined,
      })
    } catch {
      setResult({ state: 'error' })
    }
  }

  return (
    <section className="fh-intel" aria-labelledby="fh-intel-h">
      <div className="fh-intel-head">
        <h2 id="fh-intel-h" className="fh-intel-title">{voice.intelHeader}</h2>
        <p className="fh-intel-sub">{voice.intelSub}</p>
      </div>

      {/* On-hub price checker — the "is it worth it?" tool */}
      <form className="fh-check" role="search" onSubmit={check}>
        <input
          className="fh-check-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={voice.searchPlaceholder}
          aria-label={voice.searchPlaceholder}
        />
        <button className="fh-check-btn" type="submit">Check the comp</button>
      </form>
      {result.state !== 'idle' && (
        <div className="fh-check-result" aria-live="polite">
          {result.state === 'loading' && <span className="fh-check-dim">Consulting the sorceress…</span>}
          {result.state === 'miss' && <span className="fh-check-dim">No sold comps on record for that one yet — try another name.</span>}
          {result.state === 'error' && <span className="fh-check-dim">The crystal went dark. Try again in a moment.</span>}
          {result.state === 'hit' && (
            <a className="fh-check-hit" href={result.url ?? '/search'}>
              <span className="fh-check-name">{result.name}<span className="fh-check-line">{result.brand} {result.line}</span></span>
              <span className="fh-check-price">
                {result.price != null ? `$${result.price.toLocaleString('en-US')}` : 'No comps yet'}
                {result.price != null && <span className="fh-check-sample">{result.sample} sold</span>}
              </span>
            </a>
          )}
        </div>
      )}

      {figures.length > 0 ? (
        <>
          {/* Line-filter pills */}
          {lines.length > 2 && (
            <div className="fh-filter" role="group" aria-label="Filter by line">
              {lines.map(ln => (
                <button
                  key={ln}
                  type="button"
                  aria-pressed={activeLine === ln}
                  className={`fh-filter-pill${activeLine === ln ? ' is-active' : ''}`}
                  onClick={() => setActiveLine(ln)}
                >
                  {ln}
                </button>
              ))}
            </div>
          )}

          <ol className="fh-intel-list">
            {shown.map((f, i) => (
              <li key={f.figure_id} className="fh-intel-row">
                <a href={f.url} className="fh-intel-link" title={`${f.name} — ${f.sold_count} sold, median $${f.price.toLocaleString('en-US')}`}>
                  <span className="fh-intel-rank" aria-hidden="true">{i + 1}</span>
                  <span className="fh-intel-name">
                    {f.name}
                    <span className="fh-intel-line">{f.line}</span>
                  </span>
                  {flagLabel(f.flag, voice.flag) && <span className="fh-intel-flag">{flagLabel(f.flag, voice.flag)}</span>}
                  <span className="fh-intel-price">
                    ${f.price.toLocaleString('en-US')}
                    <span className="fh-intel-date">{f.last_sold ? f.last_sold : `${f.sold_count} sold`}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          {shown.length === 0 && <p className="fh-intel-empty">No ranked comps in {activeLine} yet.</p>}
          <p className="fh-intel-foot">
            Updated {new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · real eBay sold comps · every name opens its figure page
          </p>
        </>
      ) : (
        <p className="fh-intel-empty">{voice.emptyState}</p>
      )}
    </section>
  )
}
