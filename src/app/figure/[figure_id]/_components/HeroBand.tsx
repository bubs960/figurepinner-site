// HeroBand.tsx — Zone 1: Image + identity header
// Server component — no client-side JS needed

type RarityTier = 'common' | 'uncommon' | 'rare' | 'grail' | null

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
}

const RARITY_CONFIG = {
  uncommon: { label: 'Uncommon', color: 'var(--fp-accent)' },
  rare:     { label: 'Rare',     color: 'var(--fp-accent-warm)' },
  grail:    { label: 'Grail',    color: 'var(--fp-accent-rare)' },
}

const GENRE_EMOJI: Record<string, string> = {
  'wrestling': '🤼', 'marvel': '🦸', 'star-wars': '⚔️', 'dc': '🦇',
  'transformers': '🤖', 'gijoe': '🪖', 'masters-of-the-universe': '⚡',
  'teenage-mutant-ninja-turtles': '🐢', 'power-rangers': '🦕',
  'indiana-jones': '🎩', 'ghostbusters': '👻', 'mythic-legions': '🗡️',
  'thundercats': '🐱', 'action-force': '🎖️', 'dungeons-dragons': '🐉',
  'neca': '🎬', 'spawn': '🦇',
}

export default function HeroBand({
  imageUrl, characterName, brand, lineName, series, scale,
  eraLabel, releaseYear, rarityTier, genre, className,
}: HeroBandProps) {
  const rarity = rarityTier && rarityTier !== 'common' ? RARITY_CONFIG[rarityTier] : null
  const emoji = GENRE_EMOJI[genre] ?? '🤼'
  const metaParts = [
    lineName,
    series ? `Series ${series}` : null,
    releaseYear ? String(releaseYear) : null,
    scale,
  ].filter(Boolean)

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
      {/* Image */}
      <div style={{ position: 'relative' }}>
        {/* Glow behind image */}
        <div style={{
          position: 'absolute', inset: '-20px',
          background: 'radial-gradient(ellipse at center, rgba(91,141,239,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <div style={{
          position: 'relative', zIndex: 1,
          background: 'var(--fp-surface-0)',
          border: `1px solid var(--fp-border)`,
          borderRadius: 'var(--fp-radius-lg)',
          overflow: 'hidden',
          aspectRatio: '4/5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={characterName}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1.5rem' }}
            />
          ) : (
            /* Silhouette placeholder */
            <div style={{ textAlign: 'center', color: 'var(--fp-dim)' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                <circle cx="32" cy="22" r="10" />
                <path d="M12 56c0-11 9-20 20-20s20 9 20 20" />
              </svg>
              <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.5 }}>No image</div>
            </div>
          )}
        </div>

        {/* Rarity badge — only if uncommon/rare/grail */}
        {rarity && (
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2,
            background: 'rgba(10,13,28,0.85)', backdropFilter: 'blur(8px)',
            border: `1px solid ${rarity.color}`,
            borderRadius: 'var(--fp-radius-sm)',
            padding: '3px 10px',
            fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em',
            color: rarity.color, textTransform: 'uppercase',
          }}>
            {rarity.label}
          </div>
        )}
      </div>

      {/* Identity */}
      <div style={{ paddingTop: '0.5rem' }}>
        {/* Brand chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(91,141,239,0.15)',
            border: '1px solid rgba(91,141,239,0.3)',
            borderRadius: 'var(--fp-radius-sm)',
            padding: '3px 10px',
            fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--fp-accent)', textTransform: 'uppercase',
          }}>
            {brand}
          </span>
          {/* Era chip — only if eraLabel present */}
          {eraLabel && (
            <span style={{
              display: 'inline-block',
              background: 'rgba(240,160,75,0.12)',
              border: '1px solid rgba(240,160,75,0.25)',
              borderRadius: 'var(--fp-radius-sm)',
              padding: '3px 10px',
              fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.06em',
              color: 'var(--fp-accent-warm)',
            }}>
              {eraLabel}
            </span>
          )}
        </div>

        {/* Line meta */}
        <div style={{
          fontSize: '0.8rem', color: 'var(--fp-muted)', marginBottom: '0.875rem',
          letterSpacing: '0.02em',
        }}>
          {metaParts.join(' · ')}
        </div>

        {/* Character name — H1 */}
        <h1 style={{
          fontFamily: 'var(--fp-font-display)',
          fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
          letterSpacing: '0.04em',
          lineHeight: '1.0',
          color: 'var(--fp-text)',
          margin: '0 0 1rem',
        }}>
          {characterName.toUpperCase()}
        </h1>

        {/* Genre label */}
        <div style={{ fontSize: '0.8rem', color: 'var(--fp-dim)' }}>
          <span style={{ marginRight: '0.375rem' }}>{emoji}</span>
          {genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </div>
      </div>
    </div>
  )
}
