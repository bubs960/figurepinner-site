// HeroBand.tsx — Zone 1: vitrine photo + identity + price placard
// Server component — shelf design language (port of figure-shelf.html spec).
// The placard absorbed the old ValueStrip's four cells: median, range,
// comp count and confidence now read as one museum placard. Price is
// deliberately subordinate to the character block (owner direction 6/12).

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
}

interface HeroBandProps {
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
  imageUrl, characterName, brand, lineName, series, scale,
  eraLabel, releaseYear, rarityTier, genre, className,
  valuePricing, loreText, ticks, lastSale,
  conditionLabel, secondary, inferenceNote,
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
  const hasRange = p !== null && p.low !== null && p.high !== null && p.high > (p.low ?? 0)
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
                Median sold — {conditionLabel ?? 'all solds, any condition'}
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

            {/* the split's other market — quiet hairline ledger row */}
            {secondary && (
              <div style={{
                marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '10px',
              }}>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))',
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
            )}

            {/* range bar */}
            {hasRange && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                    <b style={{ fontWeight: 500, color: 'var(--shelf-cream, #f2e8d5)' }}>${fmt(p.low as number)}</b>
                    <span style={{
                      fontSize: '0.56rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
                      color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))', margin: '0 5px',
                    }}>low</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                    <span style={{
                      fontSize: '0.56rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
                      color: 'var(--shelf-cream-mut, rgba(242,232,213,0.38))', margin: '0 5px',
                    }}>high</span>
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
                    background: 'var(--shelf-gold-hi, #f5c462)', borderRadius: '1px',
                    boxShadow: '0 0 12px rgba(245,196,98,0.7)',
                  }} />
                  <span aria-hidden style={{
                    position: 'absolute', left: `${medianPos}%`, top: '100%', transform: 'translateX(-50%)',
                    fontSize: '0.56rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'var(--shelf-gold, #e0a83e)', whiteSpace: 'nowrap',
                  }}>
                    median
                  </span>
                </div>
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

            {/* last sale */}
            {lastSale && (
              <div style={{
                marginTop: '22px', paddingTop: '14px',
                borderTop: '1px solid var(--shelf-line, rgba(242,232,213,0.08))',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--shelf-cream-dim, rgba(242,232,213,0.6))' }}>
                  Most recent sale
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
