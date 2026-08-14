// PriceBlock.tsx — v4 hero price block (build plan §1, design source
// design-explorations/figure-page-v4/desktop.dc.html lines 85-112).
// Server component. Two condition buckets with Bebas price faces and
// comp-count confidence chips; replaces the legacy placard in HeroBand
// whenever at least one condition bucket has a usable median.
//
// Sparkline + 90d delta added 2026-08-14, unblocked by matcher's price-history
// emitter (MATCHER-TO-WEB-PRICE-HISTORY-EMITTER-LIVE-2026-08-14.md). Contract
// rules honored here: exactly-13 weeks oldest-first rendered as bars WITH gaps
// (sparse weeks are real — never suppress the figure); delta comes ONLY from
// delta_90d (deliberately null when window_truncated — never recomputed from
// the weeks array); absent history = no strip, no placeholder.

import type { CondBucket, PriceHistory } from './FigureDetailContent'
import { confidenceForCount, type ConfidenceTier } from '../_lib/confidence'

interface PriceBlockProps {
  sealed: CondBucket | null
  loose: CondBucket | null
  /** Weekly-median history — null until the backfill cycle reaches this fid. */
  history?: PriceHistory | null
  /** Golden-corpus annotation for the sealed bucket ("sealed carries the BAF
   *  arm" style). Generic pages pass null and get the plain median caption —
   *  never fabricated (matcher's data is the only source). */
  sealedNote?: string | null
  /** True only when the page renders a #receipts section (golden-corpus
   *  passport). Plain pages must not link a dead anchor. */
  hasReceipts?: boolean
}

// Chip palette per the handoff README: green HIGH, gold MEDIUM; LOW reads
// muted (pink is reserved for SOURCES DISAGREE only — never a thin bucket).
const CHIP_COLOR: Record<ConfidenceTier, string> = {
  high: '#4ec98c',
  medium: '#f5c462',
  low: 'rgba(242,232,213,.55)',
}

function usable(b: CondBucket | null): b is CondBucket {
  return b != null && b.median != null && b.count >= 1
}

// ── Sparkline helpers (no Intl anywhere — repo rule #8, even server-side) ────

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** "2026-W33" → the Monday of that ISO week, formatted "AUG 10". */
function isoWeekLabel(week: string, endOfWeek = false): string | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(week)
  if (!m) return null
  const year = Number(m[1]), wk = Number(m[2])
  // ISO 8601: Jan 4 is always in week 1; back up to that week's Monday.
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const isoDay = (jan4.getUTCDay() + 6) % 7 // Mon=0
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - isoDay + (wk - 1) * 7 + (endOfWeek ? 6 : 0))
  return `${MONTHS[monday.getUTCMonth()]} ${monday.getUTCDate()}`
}

/** "▲ $3 vs prior 90" caption fragment from the authoritative delta_90d. */
function deltaFragment(delta: number | null | undefined): React.ReactNode {
  if (delta == null || delta === 0) return null
  const up = delta > 0
  return (
    <> · <span style={{ color: up ? '#4ec98c' : '#e05a7a' }}>{up ? '▲' : '▼'} ${Math.abs(Math.round(delta))}</span> vs prior 90</>
  )
}

/** The 13-bar weekly-median strip (design desktop.dc.html lines 104-111).
 *  Bars scale to the bucket's max weekly median; empty weeks render a 2px
 *  stub (a visible gap, not a suppressed figure); the last week with data
 *  is gold. Renders null when no week has data for the chosen bucket. */
function SparklineStrip({ history }: { history: PriceHistory }) {
  // Prefer loose (the design's labeled bucket); fall back to sealed when
  // loose is empty across the whole window.
  const pick = (w: { loose_median: number | null; sealed_median: number | null }, key: 'loose' | 'sealed') =>
    key === 'loose' ? w.loose_median : w.sealed_median
  const bucketKey: 'loose' | 'sealed' =
    history.weeks.some(w => w.loose_median != null) ? 'loose'
    : history.weeks.some(w => w.sealed_median != null) ? 'sealed'
    : 'loose'
  const values = history.weeks.map(w => pick(w, bucketKey))
  if (!values.some(v => v != null)) return null
  const max = Math.max(...values.filter((v): v is number => v != null))
  const lastDataIdx = values.reduce((acc, v, i) => (v != null ? i : acc), -1)
  const first = isoWeekLabel(history.weeks[0].week)
  const last = isoWeekLabel(history.weeks[history.weeks.length - 1].week, true)
  return (
    <div style={{
      borderTop: '1px solid rgba(242,232,213,.08)',
      padding: '14px 26px',
      background: 'rgba(224,168,62,.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '44px' }}>
        {values.map((v, i) => (
          <span
            key={history.weeks[i].week}
            style={{
              flex: 1,
              height: v != null && max > 0 ? `${Math.max(8, Math.round((v / max) * 100))}%` : '2px',
              borderRadius: '2px 2px 0 0',
              background: v == null
                ? 'rgba(242,232,213,.08)'
                : i === lastDataIdx ? '#f5c462' : 'rgba(224,168,62,.35)',
            }}
          />
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '9.5px', color: 'rgba(242,232,213,.35)', marginTop: '6px',
      }}>
        <span>{first}</span>
        <span>weekly medians · {bucketKey}</span>
        <span>{last}</span>
      </div>
    </div>
  )
}

function Bucket({ label, bucket, priceColor, caption }: {
  label: string
  bucket: CondBucket
  priceColor: string
  caption: React.ReactNode
}) {
  const conf = confidenceForCount(bucket.count)
  const chipColor = CHIP_COLOR[conf.tier]
  return (
    <div style={{ padding: '22px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '10.5px', fontWeight: 700, letterSpacing: '.14em',
          textTransform: 'uppercase', color: 'rgba(242,232,213,.55)',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '9.5px', fontWeight: 700, letterSpacing: '.08em',
          border: `1px solid ${chipColor}`, color: chipColor,
          borderRadius: '100px', padding: '2px 9px', whiteSpace: 'nowrap',
        }}>
          {conf.chipLabel}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--fp-font-display)', fontWeight: 400,
        fontSize: 'clamp(3rem, 5vw, 4rem)', lineHeight: 1,
        color: priceColor, fontVariantNumeric: 'tabular-nums',
      }}>
        ${Math.round(bucket.median as number)}
      </div>
      <div style={{ fontSize: '11.5px', color: 'rgba(242,232,213,.55)', marginTop: '6px' }}>
        {caption}
      </div>
    </div>
  )
}

export default function PriceBlock({ sealed, loose, history, sealedNote, hasReceipts }: PriceBlockProps) {
  const buckets: React.ReactNode[] = []

  if (usable(loose)) {
    buckets.push(
      <Bucket
        key="loose"
        label="Loose / complete"
        bucket={loose}
        priceColor="#f5c462"
        caption={
          <>
            median, last 90 days
            {deltaFragment(history?.delta_90d?.loose)}
            {hasReceipts && <> · <a href="#receipts" style={{ color: 'inherit', textDecoration: 'underline' }}>how we price ↓</a></>}
          </>
        }
      />
    )
  }
  if (usable(sealed)) {
    buckets.push(
      <Bucket
        key="sealed"
        label="Sealed / carded"
        bucket={sealed}
        priceColor="#f2e8d5"
        caption={
          <>
            {sealedNote ?? 'median, last 90 days · sealed sales only'}
            {deltaFragment(history?.delta_90d?.sealed)}
          </>
        }
      />
    )
  }
  if (buckets.length === 0) return null

  return (
    <div style={{
      marginTop: '24px',
      border: '1px solid rgba(224,168,62,.35)',
      borderRadius: '16px',
      background: 'linear-gradient(160deg, #16131f 0%, #0b0a12 65%)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
      }}>
        {buckets.map((b, i) => (
          <div key={i} style={i > 0 ? { borderLeft: '1px solid rgba(242,232,213,.08)' } : undefined}>
            {b}
          </div>
        ))}
      </div>
      {history && <SparklineStrip history={history} />}
    </div>
  )
}
