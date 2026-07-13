'use client'
// VaultCase — the user's glass case (vault-shelf mockup). Cards link to the
// figure page (locked IA); quick-edit stays on the card: condition chip
// cycles on click, paid is inline-editable, ✕ removes. State + persistence
// live in VaultClient (the parent owns the items array so the masthead totals
// stay in lockstep); this component is controlled — it renders items and
// reports edits up via onPatch / onRemove.
//
// Phase B (Claiming Ritual, "The Shelf with gaps"): a capped slice of the
// Want List renders interleaved into the SAME shelf grid as owned figures —
// grayscale, dashed-gold silhouettes, "MISSING — tap to hunt". The full
// Want List with pricing/target-alerts still lives in the richer "Hunt"
// section below (page.tsx) — this is the shelf preview, not a replacement.
//
// Case motion (spotlight drift + cursor takeover) is DOM-managed in one
// mount effect, same pattern as the homepage ShelfCase.

import { useEffect, useRef, useState } from 'react'
import type { VaultShelfItem, HuntItem } from '../_lib/vaultData'

const CONDITIONS = ['MOC', 'Near Mint', 'Loose', 'Opened', 'Damaged']
const PIN_PATH = 'M14.6 2.6 21.4 9.4 19.8 11l-.9-.3-4 4 .3 2.6-1.6 1.6-4-4-5.2 5.2-1.4-1.4L8.2 13.5l-4-4L5.8 8l2.6.3 4-4-.3-.9 2.5-.8Z'
// Enough to fill out a row or two of gaps without duplicating the full Hunt
// section's job — that section still shows every want-list item with pricing.
const WANT_GAP_CAP = 8

function condClass(c: string): string {
  if (c === 'MOC') return 'moc'
  if (c === 'Near Mint') return 'nm'
  return 'loose'
}

function rowsOf<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

type Slot =
  | { kind: 'owned'; item: VaultShelfItem }
  | { kind: 'want'; item: HuntItem }

export default function VaultCase({ items, hunt, onPatch, onRemove }: {
  items: VaultShelfItem[]
  hunt: HuntItem[]
  onPatch: (rowId: string, body: { paid?: number; condition?: string }) => void
  onRemove: (rowId: string) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  // spotlight: drift by default, cursor takes over
  useEffect(() => {
    const caseEl = rootRef.current?.querySelector<HTMLElement>('.vlt-case')
    if (!caseEl || !window.matchMedia('(pointer:fine)').matches) return
    let manualTimer: ReturnType<typeof setTimeout> | null = null
    const onMove = (e: MouseEvent) => {
      const r = caseEl.getBoundingClientRect()
      caseEl.style.setProperty('--mx', `${e.clientX - r.left}px`)
      caseEl.style.setProperty('--my', `${e.clientY - r.top}px`)
      caseEl.classList.add('manual')
      if (manualTimer) clearTimeout(manualTimer)
      manualTimer = setTimeout(() => caseEl.classList.remove('manual'), 2600)
    }
    caseEl.addEventListener('mousemove', onMove)
    return () => {
      caseEl.removeEventListener('mousemove', onMove)
      if (manualTimer) clearTimeout(manualTimer)
    }
  }, [])

  const wantGhosts = hunt.slice(0, WANT_GAP_CAP)
  const slots: Slot[] = [
    ...items.map(item => ({ kind: 'owned' as const, item })),
    ...wantGhosts.map(item => ({ kind: 'want' as const, item })),
  ]
  const shelves = rowsOf(slots, 4)
  // the ghost slot rides the last shelf when there's room, else its own shelf
  const lastShort = shelves.length > 0 && shelves[shelves.length - 1].length < 4
  const totallyEmpty = items.length === 0 && wantGhosts.length === 0

  return (
    <div className="vlt-case-col" ref={rootRef}>
      <div className="vlt-case" data-fph-reveal>
        <div className="vlt-case-light" aria-hidden><i /></div>
        <div className="vlt-case-sweep" aria-hidden />
        <div className="vlt-case-label">
          Your case — {items.length} figure{items.length === 1 ? '' : 's'} under glass
        </div>

        {shelves.map((row, ri) => {
          const isLast = ri === shelves.length - 1
          return (
            <div className="vlt-shelf" key={ri}>
              <div className={`vlt-shelf-row${isLast && lastShort ? ' short' : ''}`}>
                {row.map((slot, ci) => slot.kind === 'owned' ? (
                  <Card
                    key={slot.item.rowId}
                    item={slot.item}
                    index={ri * 4 + ci}
                    onPatch={onPatch}
                    onRemove={onRemove}
                  />
                ) : (
                  <WantGhost key={slot.item.rowId} item={slot.item} index={ri * 4 + ci} />
                ))}
                {isLast && lastShort && <GhostSlot empty={totallyEmpty} />}
              </div>
            </div>
          )
        })}

        {(shelves.length === 0 || !lastShort) && (
          <div className="vlt-shelf">
            <div className="vlt-shelf-row short">
              <GhostSlot empty={totallyEmpty} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ item, index, onPatch, onRemove }: {
  item: VaultShelfItem
  index: number
  onPatch: (rowId: string, body: { paid?: number; condition?: string }) => void
  onRemove: (rowId: string) => void
}) {
  const [editingPaid, setEditingPaid] = useState(false)
  const [paidValue, setPaidValue] = useState('')

  const delta = item.median != null && item.paid > 0 ? item.median - item.paid : null

  function cycleCondition(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    const next = CONDITIONS[(CONDITIONS.indexOf(item.condition) + 1) % CONDITIONS.length]
    onPatch(item.rowId, { condition: next })
  }
  function startPaidEdit(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setPaidValue(item.paid ? String(item.paid) : '')
    setEditingPaid(true)
  }
  function commitPaid() {
    setEditingPaid(false)
    const n = parseFloat(paidValue)
    if (!isNaN(n) && n >= 0 && n !== item.paid) onPatch(item.rowId, { paid: n })
  }

  return (
    <a className="vlt-fig" style={{ '--i': index } as React.CSSProperties} href={item.href}>
      <div className={`vlt-mount${item.lineComplete ? ' complete' : ''}`}>
        <span className="vlt-pin-mark" role="img" aria-label="Pinned to your Vault">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d={PIN_PATH} /></svg>
        </span>
        <button
          className="vlt-remove"
          aria-label={`Remove ${item.name} from your Vault`}
          title="Remove from Vault"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(item.rowId) }}
        >
          ✕
        </button>
        {item.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.img} alt={`${item.name} — ${item.tag}`} loading={index < 4 ? 'eager' : 'lazy'} />
        ) : (
          <span className="vlt-noimg" aria-hidden>{item.name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="vlt-fig-name">{item.name}</div>
      <div className="vlt-fig-tag">{item.tag}</div>
      {item.lineComplete && (
        <div className="vlt-complete-badge" title={`${item.lineLabel} — every figure in this wave, on your shelf`}>
          {item.lineOwned}/{item.lineTotal} — SHELF COMPLETE
        </div>
      )}
      <div className="vlt-fig-meta">
        <button
          className={`vlt-cond ${condClass(item.condition)}`}
          title="Click to change condition"
          onClick={cycleCondition}
        >
          {item.condition}
        </button>
        {delta != null && Math.abs(delta) >= 0.01 && (
          <span className={`vlt-delta ${delta >= 0 ? 'up' : 'dn'}`}>
            <i>{delta >= 0 ? '▲' : '▼'}</i>${Math.abs(delta).toFixed(2)}
          </span>
        )}
      </div>
      <div
        className="vlt-fig-val"
        title={item.median != null
          ? `Median of ${item.comps} real sold comps${item.medianKind !== 'all' ? ` (${item.medianKind} market — matches this item's condition)` : ' (all conditions)'}`
          : 'No recent sold comps for this figure'}
      >
        {item.median != null
          ? <>{item.medianKind !== 'all' ? `${item.medianKind} ` : ''}median ${item.median.toFixed(2)} · </>
          : <>no recent solds · </>}
        {editingPaid ? (
          <input
            className="vlt-paid-input"
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={paidValue}
            onClick={e => { e.preventDefault(); e.stopPropagation() }}
            onChange={e => setPaidValue(e.target.value)}
            onBlur={commitPaid}
            onKeyDown={e => {
              if (e.key === 'Enter') commitPaid()
              if (e.key === 'Escape') setEditingPaid(false)
            }}
          />
        ) : (
          <button className="vlt-paid-btn" title="Click to edit what you paid" onClick={startPaidEdit}>
            paid {item.paid ? `$${item.paid.toFixed(2)}` : '—'}
          </button>
        )}
      </div>
    </a>
  )
}

/** Phase B "gap on the shelf": a want-list figure rendered as a desaturated
 *  silhouette in the same grid an owned figure would occupy — the tagline
 *  ("every grail starts as a gap on the shelf") turned into a UI object.
 *  Links straight to the figure page, same as an owned card. */
function WantGhost({ item, index }: { item: HuntItem; index: number }) {
  return (
    <a
      className="vlt-fig vlt-want"
      style={{ '--i': index } as React.CSSProperties}
      href={item.href}
      aria-label={`${item.name} — missing from your case, tap to hunt`}
    >
      <div className="vlt-want-mount">
        {item.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.img} alt="" aria-hidden loading="lazy" />
        ) : (
          <span className="vlt-noimg" aria-hidden>{item.name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="vlt-fig-name">{item.name}</div>
      <div className="vlt-want-caption">MISSING &mdash; tap to hunt</div>
    </a>
  )
}

function GhostSlot({ empty }: { empty?: boolean }) {
  return (
    <a
      className="vlt-fig ghost"
      href="/search"
      aria-label={empty ? 'Your case is empty — find your first figure' : 'Room on the shelf — find your next figure'}
    >
      <div className="vlt-ghost-mount">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={PIN_PATH} /></svg>
        <span className="g1">{empty ? 'Your case is empty' : 'Room on the shelf'}</span>
        <span className="g2">{empty ? 'Pin your first figure →' : 'Find your next one →'}</span>
      </div>
    </a>
  )
}
