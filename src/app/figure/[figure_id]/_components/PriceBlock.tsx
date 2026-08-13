// PriceBlock.tsx — v4 hero price block (build plan §1, design source
// design-explorations/figure-page-v4/desktop.dc.html lines 85-112).
// Server component. Two condition buckets with Bebas price faces and
// comp-count confidence chips; replaces the legacy placard in HeroBand
// whenever at least one condition bucket has a usable median.
//
// Deliberately NOT here (plan §1): the weekly-median sparkline strip and the
// "▲ $N vs prior 90" delta — both blocked on matcher's price-history answer
// (WEB-TO-MATCHER-V4-NEEDS-WEEKLY-MEDIAN-HISTORY-2026-08-13). No empty slot,
// no placeholder.

import type { CondBucket } from './FigureDetailContent'
import { confidenceForCount, type ConfidenceTier } from '../_lib/confidence'

interface PriceBlockProps {
  sealed: CondBucket | null
  loose: CondBucket | null
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

export default function PriceBlock({ sealed, loose, sealedNote, hasReceipts }: PriceBlockProps) {
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
        caption={sealedNote ?? 'median, last 90 days · sealed sales only'}
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
    </div>
  )
}
