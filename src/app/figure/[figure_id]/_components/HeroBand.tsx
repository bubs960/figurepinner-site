// HeroBand.tsx — Zone 1: vitrine photo + identity + price placard
// Server component — shelf design language (port of figure-shelf.html spec).
// The placard absorbed the old ValueStrip's four cells: median, range,
// comp count and confidence now read as one museum placard. Price is
// deliberately subordinate to the character block (owner direction 6/12).

import ClaimPin from '@/app/components/ClaimPin'
import ConditionShineBox from './ConditionShineBox'

type RarityTier = 'common' | 'uncommon' | 'rare' | 'grail' | null

interface Pricing {
  median: number | null
  trend_90d_pct: number | null
  low: number | null
  high: number | null
  confidence: 1 | 2 | 3 | 4 | 5
  comp_count: number
  dispersion_warning?: boolean
  /** Honest "extremes labeled" line when the range fence clipped real sales. */
  rangeExtremeNote?: string | null
  /** Range-bar suppression (Steve, 2026-07-16): true for thin (3-9 comp)
   *  buckets. Even p25-p75 read as untrustworthy at that width (126% of
   *  median on the ticket's own real 8-comp figure) -- rather than keep
   *  narrowing the percentile band, the whole dollar range bar is hidden for
   *  thin buckets; median + confidence + comp count (elsewhere in this
   *  component, unaffected) are the whole story. `low`/`high` above are
   *  still real values (still used for JSON-LD, a separate surface) -- this
   *  flag ONLY gates the visual bar below. */
  isThinBucket?: boolean
}

interface ConditionRow {
  key: 'sealed' | 'loose'
  label: string
  median: number
  count: number
  depthLabel: string
  rangeLabel?: string | null
}

interface HeroBandProps {
  /** Powers the ambient brass corner pin (Claiming Ritual Phase A graft). */
  figureId: string
  imageUrl: string | null
  characterName: string
  brand: string
  lineName: string
  series: number | null
  scale: string | null
  eraLabel: string | null
  releaseYear: number | null
  rarityTier: RarityTier
  genre: string
  className?: string
  valuePricing?: Pricing | null
  valueStripClassName?: string
  /** KB enrichment sentence (match_represented) — renders as the hero lore paragraph. */
  loreText?: string | null
  /** Normalized 0–1 positions of recent comps within [low, high] for the range-bar ticks. */
  ticks?: number[]
  /** Most recent individual sale, if known. */
  lastSale?: { price: number } | null
  /** Names the headline market when the condition split is statistically
   *  valid ("sealed / carded" | "loose"); null keeps the legacy blended label. */
  conditionLabel?: string | null
  /** Thin per-condition signals are shown even when the headline remains mixed. */
  conditionRows?: ConditionRow[]
  /** The split's other bucket — a quiet ledger row under the price. */
  secondary?: { label: string; median: number; count: number } | null
  /** Honesty footnote, e.g. "Includes N comps classified from the listing title." */
  inferenceNote?: string | null
}

const RARITY_CONFIG = {
  uncommon: { label: 'Uncommon' },
  rare:     { label: 'Rare' },
  grail:    { label: 'Grail' },
}

const CONFIDENCE_WORD: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Thin', 2: 'Limited', 3: 'Moderate', 4: 'Strong', 5: 'Deep',
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function HeroBand({
  figureId, imageUrl, characterName, brand, lineName, series, scale,
  eraLabel, releaseYear, rarityTier, genre, className,
  valuePricing, loreText, ticks, lastSale,
  conditionLabel, conditionRows, secondary, inferenceNote,
}: HeroBandProps) {
  const rarity = rarityTier && rarityTier !== 'common' ? RARITY_CONFIG[rarityTier] : null
  const genreLabel = genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const specs: Array<{ k: string; v: string }> = [
    { k: 'Line', v: lineName },
    ...(series ? [{ k: 'Wave', v: String(series) }] : []),
    ...(releaseYear ? [{ k: 'Year', v: String(releaseYear) }] : []),
    ...(scale ? [{ k: 'Scale', v: scale }] : []),
    { k: 'Maker', v: brand },
    ...(eraLabel ? [{ k: 'Era', v: eraLabel }] : []),
  ]

  const p = valuePricing ?? null
  const marketLabel = conditionLabel ? `Median sold - ${conditionLabel}` : 'Mixed condition estimate'
  const visibleConditionRows = conditionRows ?? []
  // Range-bar tone must follow the ACTUAL headline population, not be
  // hardcoded gold (webaudit 2026-07-15 scope note: "if the range bar's
  // population is ever not the sealed bucket... both the label and the
  // color/shine assignment must reflect the correct population"). A
  // loose-only figure (no sealed data at all) has conditionLabel === 'loose'
  // and its range bar IS the loose bucket's p10/p90 — that case must render
  // red, not gold, or the color cue would lie about which population it is.
  const rangeBarTone: 'gold' | 'red' = conditionLabel === 'loose' ? 'red' : 'gold'
  // Steve, 2026-07-16: thin (3-9 comp) buckets suppress the range bar
  // entirely, not just narrow it further -- see isThinBucket doc on Pricing.
  const hasRange = p !== null && !p.isThinBucket && p.low !== null && p.high !== null && p.high > (p.low ?? 0)
  const medianPos = (p && hasRange && p.median !== null)
    ? Math.min(92, Math.max(8, ((p.median - (p.low as number)) / ((p.high as number) - (p.low as number))) * 100))
    : 50
  const trend = p?.trend_90d_pct ?? null

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 380px) 1fr',
        gap: '3rem',
        alignItems: 'start',
      }}
    >
      <style>{`
        .fp-vit-sweep::after {
          content: '';
          position: absolute; top: -25%; bottom: -25%; left: 0; width: 34%;
          background: linear-gradient(100deg, transparent, rgba(255,236,194,0.045) 32%, rgba(255,236,194,0.12) 50%, rgba(255,236,194,0.045) 68%, transparent);
          transform: translateX(-140%) skewX(-18deg);
          animation: fp-vit-sweep 9s linear infinite;
          pointer-events: none;
        }
        @keyframes fp-vit-sweep {
          0%   { transform: translateX(-140%) skewX(-18deg); }
          22%  { transform: translateX(440%) skewX(-18deg); }
          100% { transform: translateX(440%) skewX(-18deg); }
        }
        .fp-plc-tick {
          position: absolute; bottom: 50%; width: 1px; height: 11px;
          background: var(--shelf-gold, #e0a83e);
          transform-origin: bottom;
          animation: fp-tick-in 0.45s cubic-bezier(0.22,0.61,0.36,1) both;
        }
        @keyframes fp-tick-in {
          from { opacity: 0; transform: scaleY(0); }
          to   { opacity: 0.55; transform: scaleY(1); }
        }
        .fp-plc-med {
          animation: fp-med-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.1s both;
        }
        @keyframes fp-med-in {
          from { transform: translate(-50%,-50%) scaleY(0); }
          to   { transform: translate(-50%,-50%) scaleY(1); }
        }
        .fp-sold-stamp {
          animation: fp-stamp 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.5s both;
        }
        @keyframes fp-stamp {
          0%   { opacity: 0; transform: scale(2.3) rotate(-15deg); }
          62%  { opacity: 1; transform: scale(0.92) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(-2deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-vit-sweep::after { animation: none; opacity: 0; }
          .fp-plc-tick { animation: none; opacity: 0.55; transform: scaleY(1); }
          .fp-plc-med { animation: none; transform: translate(-50%,-50%) scaleY(1); }
          .fp-sold-stamp { animation: none; opacity: 1; }
        }
      `}</style>

      {/* Vitrine — outer wrapper reserves space before image loads, preventing CLS */}
      <div style={{ position: 'relative', minHeight: '325px' }}>
        <div
          className="fp-vit-sweep"
          style={{
            position: 'relative',
            border: '1px solid var(--shelf-line, rgba(242,232,213,0.08))',
            borderRadius: '16px',
            padding: '26px 22px 20px',
            background: 'linear-gradient(180deg, rgba(242,232,213,0.03), rgba(242,232,213,0.008) 60%, transparent)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45), inset 0 0 60px rgba(224,168,62,0.035)',
            overflow: 'hidden',
          }}
        >
          {/* Cream mount the photo sits on */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'var(--shelf-mount, linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%))',
            borderRadius: '8px 8px 4px 4px',
            padding: '7px 7px 8px',
            boxShadow: '0 18px 34px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4)',
          }}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                // Stable hook for ClaimRitual.tsx (Session 1 de-risk spike):
                // FigureActions.tsx reads this node's getBoundingClientRect()
                // at "Add to Collection" time to know where the photo-flight
                // should start from. The image URL itself is threaded down as
                // an explicit prop instead (see FigureActions `imgSrc`) — this
                // id exists only for live on-screen geometry, which can't come
                // from a prop.
                id="fp-hero-photo"
                src={imageUrl}
                alt={`${characterName} ${lineName} action figure`}
                fetchPriority="high"
                style={{
                  width: '100%', aspectRatio: '4/4.7', objectFit: 'contain',
                  borderRadius: '4px', background: '#e9e0cd', display: 'block',
                }}
              />
            ) : (
              <div style={{
                width: '100%', aspectRatio: '4/4.7', borderRadius: '4px',
                background: '#e9e0cd', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: '#8a7e63',
              }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                  <circle cx="32" cy="22" r="10" />
                  <path d="M12 56c0-11 9-20 20-20s20 9 20 20" />
                </svg>
                <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.7 }}>No image yet</div>
              </div>
            )}
          </div>

          {/* Lit glass ledge the mount rests on */}
          <div aria-hidden style={{
            position: 'relative', zIndex: 1, margin: '16px -14px 0', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(245,196,98,0.45), transparent)',
            boxShadow: '0 5px 16px rgba(245,196,98,0.14)',
          }} />
        </div>

        {/* Rarity badge — only if uncommon/rare/grail */}
        {rarity && (
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2,
            background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid var(--shelf-line-gold, rgba(224,168,62,0.2))',
            borderRadius: '4px',
            padding: '3px 10px',
            fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em',
            color: 'var(--shelf-gold-hi, #f5c462)', textTransform: 'uppercase',
          }}>
            {rarity.label}
          </div>
        )}

        <ClaimPin figureId={figureId} />
      </div>

      {/* Identity + placard */}
      <div style={{ paddingTop: '0.25rem', display: 'flex', flexDirection: 'column' }}>
        {/* Eyebrow — genre + maker + line, gold ruled */}
        <div style={{
          fontSize: '0.84rem', fontWeight: 500, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--shelf-gold, #e0a83e)',
          display: 'inline-flex', alignItems: 'center', gap: '11px',
        }}>
          <span aria-hidden style={{ width: '30px', height: '1px', background: 'var(--shelf-gold, #e0a83e)', opacity: 0.65, flexShrink: 0 }} />
          {genreLabel} — {brand} {lineName}
        </div>

        {/* Character name — H1 */}
        <h1 style={{
          fontFamily: 'var(--fp-font-display)',
          fontWeight: 400,
          fontSize: 'clamp(3.25rem, 5.6vw, 4.875rem)',
          letterSpacing: '0.012em',
          lineHeight: '0.94',
          color: 'var(--shelf-cream, #f2e8d5)',
          margin: '12px 0 0',
        }}>
          {characterName.toUpperCase()}
        </h1>

        {/* Spec row */}
        <div style={{ marginTop: '18px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', rowGap: '10px' }}>
          {specs.map((s, i) => (
            <div key={s.k} style={{
              padding: i === 0 ? '0 22px 0 0' : '0 22px',
              borderLeft: i === 0 ? 'none' : '1px solid var(--shelf-line, rgba(242,232,213,0.08))',
            }}>
              <div style={{
                fontSize: '0.69rem', fontWeight: 500, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))',
              }}>
                {s.k}
              </div>
              <div style={{ marginTop: '3px', fontSize: '1.03rem', fontWeight: 500, color: 'var(--shelf-cream, #f2e8d5)', whiteSpace: 'nowrap' }}>
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* Lore — the character paragraph (KB enrichment; the growth surface) */}
        {loreText && (
          <p style={{
            margin: '16px 0 0', maxWidth: '54ch',
            fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.7,
            color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))',
          }}>
            {loreText}
          </p>
        )}

        {/* THE PLACARD — median, range, confidence, last sale. Quiet by design. */}
        {p && p.median !== null && (
          <div style={{
            marginTop: '24px',
            border: '1px solid var(--shelf-line-gold, rgba(224,168,62,0.2))',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, rgba(224,168,62,0.05), rgba(224,168,62,0.015) 60%, transparent)',
            padding: '20px 26px 18px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* thin lit top edge */}
            <div aria-hidden style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(245,196,98,0.55), transparent)',
            }} />

            {/* head: label + confidence */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{
                fontSize: '0.63rem', fontWeight: 500, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))',
              }}>
                {marketLabel}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
                <span aria-hidden style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2.5px' }}>
                  {[5, 8, 11].map((h, i) => (
                    <span key={i} style={{
                      width: '3px', height: `${h}px`, borderRadius: '1px', display: 'block',
                      background: 'var(--shelf-gold, #e0a83e)',
                      opacity: p.confidence >= (i + 2) ? 1 : 0.25,
                    }} />
                  ))}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                  <strong style={{ fontWeight: 500, color: 'var(--shelf-gold-hi, #f5c462)' }}>
                    {CONFIDENCE_WORD[p.confidence]}
                  </strong>
                  {' '}— {p.comp_count} real sold comp{p.comp_count === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* price */}
            <div style={{
              marginTop: '4px',
              fontFamily: 'var(--fp-font-display)', fontWeight: 400,
              fontSize: 'clamp(2.5rem, 4.2vw, 3.375rem)',
              lineHeight: 1, letterSpacing: '0.02em',
              color: 'var(--shelf-gold-hi, #f5c462)',
              fontVariantNumeric: 'tabular-nums',
              display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap',
            }}>
              ${fmt(p.median)}
              {trend !== null && Math.abs(trend) >= 1 && (
                <span style={{
                  fontFamily: 'var(--fp-font-body)', fontSize: '0.72rem', fontWeight: 500,
                  letterSpacing: '0.08em',
                  color: trend > 0 ? 'var(--fp-success, #00C870)' : 'var(--shelf-cream-dim, rgba(242,232,213,0.6))',
                }}>
                  {trend > 0 ? '▲' : '▼'} {Math.abs(Math.round(trend))}% 90d
                </span>
              )}
            </div>

            {/* per-condition signals — visible even when the headline remains mixed.
                CONFIRMED LIVE 2026-07-15 (post-deploy DOM check on the Hogan page,
                the ticket's own example): this branch is the one that ACTUALLY
                fires for split-segmentation figures with a non-headline bucket
                present, NOT the `secondary` branch below — placardConditionRows
                in FigureDetailContent.tsx filters out only the headline
                condition, so the non-headline bucket survives into
                conditionRows regardless of segmentation, meaning this branch's
                length is >0 whenever `secondary` would ALSO have been non-null.
                The original fix wired ConditionShineBox into the `secondary`
                branch only, which was structurally unreachable for the ticket's
                own example — moved the same tone-per-row treatment here instead. */}
            {visibleConditionRows.length > 0 ? (
              <div style={{
                marginTop: '13px',
                paddingTop: '10px',
                borderTop: '1px solid var(--shelf-line, rgba(242,232,213,0.08))',
                display: 'grid',
                gap: '10px',
              }}>
                {visibleConditionRows.map(row => (
                  <ConditionShineBox key={row.key} tone={row.key === 'loose' ? 'red' : 'gold'} instanceKey={row.key}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: row.key === 'loose' ? 'var(--fp-danger-hi, #F97075)' : 'var(--shelf-gold-hi, #f5c462)',
                        minWidth: '132px',
                      }}>
                        {row.label}
                      </span>
                      <span style={{
                        fontFamily: 'var(--fp-font-display)', fontSize: '1.35rem', letterSpacing: '0.03em',
                        color: 'var(--shelf-cream, #f2e8d5)', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                      }}>
                        ${fmt(row.median)}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                        {row.count} comp{row.count === 1 ? '' : 's'} · {row.depthLabel}
                      </span>
                      {row.rangeLabel && (
                        <span style={{
                          fontSize: '0.6rem',
                          // 2026-07-15 (Steve, contrast report on loose row): was
                          // --shelf-cream-mut (0.38 opacity) — legible on the neutral
                          // dark background other tertiary labels (low/high captions)
                          // sit on, but this span renders INSIDE the red-tinted
                          // ConditionShineBox, where the same opacity reads much
                          // fainter. Bumped to --shelf-cream-dim (0.6 opacity, already
                          // used a few lines up for "N comps · depthLabel" in this same
                          // row) so range text has the same real contrast as its
                          // sibling label, not a muted afterthought.
                          color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))',
                          letterSpacing: '0.04em',
                        }}>
                          range {row.rangeLabel}
                        </span>
                      )}
                    </div>
                  </ConditionShineBox>
                ))}
              </div>
            ) : secondary && (
              // HeroBand condition-color fix (webaudit 2026-07-15): the loose
              // secondary row used to sit as plain text directly above the
              // range bar below, with no visual boundary — Steve read $20 as
              // if it were part of the sealed-only $65-$625 range bar right
              // under it. Red shine box, same graphic polish as the gold
              // range-bar box below (Steve's explicit "no lesser treatment"
              // requirement), makes the population boundary read on a fast
              // scroll-past, not just close reading.
              <div style={{ marginTop: '14px' }}>
                <ConditionShineBox tone="red" instanceKey="loose">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: 'var(--fp-danger-hi, #F97075)',
                    }}>
                      {secondary.label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--fp-font-display)', fontSize: '1.35rem', letterSpacing: '0.03em',
                      color: 'var(--shelf-cream, #f2e8d5)', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                    }}>
                      ${fmt(secondary.median)}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))' }}>
                      {secondary.count} comp{secondary.count === 1 ? '' : 's'}
                    </span>
                  </div>
                </ConditionShineBox>
              </div>
            )}

            {/* range bar — tone follows the ACTUAL headline population
                (usually sealed/gold, but a loose-only figure renders red —
                see rangeBarTone above). Verified 2026-07-15: low/high are
                always the SAME headline bucket's data, never mixed with the
                secondary condition's — p10/p90 on trustworthy (10+ comp)
                buckets, narrowed to p25/p75 on thin (3-9 comp) buckets since
                2026-07-16 (range-width fix). Qualifier text names the
                population explicitly as the backup to the color cue. */}
            {hasRange && (
              <div style={{ marginTop: '16px' }}>
                <ConditionShineBox tone={rangeBarTone} instanceKey="range">
                  {conditionLabel && (
                    <div style={{
                      fontSize: '0.56rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: rangeBarTone === 'red' ? 'var(--fp-danger-hi, #F97075)' : 'var(--shelf-gold-hi, #f5c462)',
                      marginBottom: '8px',
                    }}>
                      Range shown: {conditionLabel} only
                    </div>
                  )}
                  {/* webaudit SHOULD-1, 2026-07-16: "low"/"high" overstate precision --
                      these are p25/p75 on thin buckets (25% of real sales sit below
                      "low", 25% above "high") and even on trustworthy buckets the fence
                      already means "high" isn't literally the highest sale. "Typical"
                      is accurate either way, applied unconditionally rather than only
                      on the thin tier. */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                      <b style={{ fontWeight: 500, color: 'var(--shelf-cream, #f2e8d5)' }}>${fmt(p.low as number)}</b>
                      <span style={{
                        fontSize: '0.56rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))', margin: '0 5px',
                      }}>typical low</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                      <span style={{
                        fontSize: '0.56rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))', margin: '0 5px',
                      }}>typical high</span>
                      <b style={{ fontWeight: 500, color: 'var(--shelf-cream, #f2e8d5)' }}>${fmt(p.high as number)}</b>
                    </div>
                  </div>
                  <div style={{ position: 'relative', height: '30px', marginTop: '6px' }}>
                    <div aria-hidden style={{
                      position: 'absolute', left: 0, right: 0, top: '50%', height: '1px',
                      background: 'linear-gradient(90deg, rgba(242,232,213,0.06), rgba(242,232,213,0.18), rgba(242,232,213,0.06))',
                    }} />
                    <div aria-hidden style={{ position: 'absolute', top: '50%', left: 0, width: '1px', height: '14px', transform: 'translateY(-50%)', background: 'rgba(242,232,213,0.25)' }} />
                    <div aria-hidden style={{ position: 'absolute', top: '50%', right: 0, width: '1px', height: '14px', transform: 'translateY(-50%)', background: 'rgba(242,232,213,0.25)' }} />
                    {(ticks ?? []).map((t, i) => (
                      <span
                        key={i}
                        className="fp-plc-tick"
                        style={{ left: `${Math.min(98, Math.max(2, t * 100))}%`, animationDelay: `${0.15 + i * 0.035}s` }}
                        aria-hidden
                      />
                    ))}
                    <span className="fp-plc-med" aria-hidden style={{
                      position: 'absolute', left: `${medianPos}%`, top: '50%',
                      width: '2px', height: '24px',
                      background: rangeBarTone === 'red' ? 'var(--fp-danger-hi, #F97075)' : 'var(--shelf-gold-hi, #f5c462)',
                      borderRadius: '1px',
                      boxShadow: rangeBarTone === 'red' ? '0 0 12px rgba(249,112,117,0.7)' : '0 0 12px rgba(245,196,98,0.7)',
                    }} />
                    <span aria-hidden style={{
                      position: 'absolute', left: `${medianPos}%`, top: '100%', transform: 'translateX(-50%)',
                      fontSize: '0.56rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
                      color: rangeBarTone === 'red' ? 'var(--fp-danger, #E5484D)' : 'var(--shelf-gold, #e0a83e)',
                      whiteSpace: 'nowrap',
                    }}>
                      median
                    </span>
                  </div>
                </ConditionShineBox>
              </div>
            )}

            {/* labeled extreme — a clipped graded-lot/bundle, kept honest */}
            {p.rangeExtremeNote && (
              <div style={{
                marginTop: '10px',
                fontSize: '0.62rem', fontWeight: 400, letterSpacing: '0.04em',
                color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))',
              }}>
                {p.rangeExtremeNote}
              </div>
            )}

            {/* dispersion caveat — 2026-07-15 (webaudit found dead-wired, Steve set
                threshold + treatment): a different claim than rangeExtremeNote above.
                That note means "a sale was excluded from this range." This means "no
                sale was excluded, but the sample is thin enough that the honest range
                reads wide relative to its own median — directional, not precise."
                Deliberately lighter than rangeExtremeNote (smaller, more muted) since
                it's flagging read-confidence, not a data-integrity exclusion. Only
                shown when rangeExtremeNote ISN'T already firing, so the two never
                stack and repeat the same "take this range with caution" idea twice. */}
            {!p.rangeExtremeNote && p.dispersion_warning && (
              <div style={{
                marginTop: '10px',
                fontSize: '0.58rem', fontWeight: 400, letterSpacing: '0.04em',
                color: 'var(--shelf-cream-mut, rgba(242,232,213,0.30))',
                fontStyle: 'italic',
              }}>
                Wide spread on thin data — read as directional, not precise.
              </div>
            )}

            {/* last sale */}
            {lastSale && (
              <div style={{
                marginTop: '22px', paddingTop: '14px',
                borderTop: '1px solid var(--shelf-line, rgba(242,232,213,0.08))',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                  {/* webaudit FIX-1, 2026-07-16: eligibility is gated to the DISPLAYED
                      [low, high] band (see lastSale in FigureDetailContent.tsx), which
                      excluded ~20% of a thin bucket's sales under the old p10-p90 band
                      but excludes ~50% by construction under the new p25-p75 quartile
                      band -- "Most recent sale" became a false recency claim on thin
                      buckets (the row often shows an older in-band sale while a newer
                      out-of-band one exists). Relabeled to say what's actually true. */}
                  Recent sale in shown range
                </span>
                <span aria-hidden style={{
                  flex: '1 1 auto', borderBottom: '1px dotted rgba(242,232,213,0.18)',
                  transform: 'translateY(-3px)', minWidth: '20px',
                }} />
                <span className="fp-sold-stamp" style={{
                  fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.16em',
                  color: '#1a1206', background: 'var(--shelf-gold, #e0a83e)',
                  borderRadius: '3px', padding: '3px 7px',
                }}>
                  SOLD
                </span>
                <span style={{
                  fontFamily: 'var(--fp-font-display)', fontSize: '1.3rem', letterSpacing: '0.03em',
                  color: 'var(--shelf-cream, #f2e8d5)', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                }}>
                  ${fmt(lastSale.price)}
                </span>
              </div>
            )}

            {/* honesty footnote — only after matcher's title-fallback cron deploy */}
            {inferenceNote && (
              <div style={{
                marginTop: '10px',
                fontSize: '0.62rem', fontWeight: 400, letterSpacing: '0.04em',
                color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))',
              }}>
                {inferenceNote}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
