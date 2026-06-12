// LoreBand.tsx — Zone 3: Lore/context sentences
// Server component — SSR critical for SEO (makes each page unique to rank)
// Returns null when hasContent is false — nothing renders, no empty panel

import { renderLoreBand, renderSentenceToHtml, type LoreInput } from '../_lib/loreRenderer'

interface LoreBandProps {
  loreInput: LoreInput
}

export default function LoreBand({ loreInput }: LoreBandProps) {
  const { sentences, hasContent } = renderLoreBand(loreInput)
  if (!hasContent) return null

  return (
    <section
      className="fp-loreband"
      style={{
        borderLeft: '2px solid var(--shelf-line-gold, rgba(224,168,62,.20))',
        padding: '0.25rem 0 0.25rem 1.625rem',
        maxWidth: '70ch',
      }}
    >
      {/* em = line-name emphasis from loreRenderer — rendered as weighted cream, not italic (matches spec's .lore strong) */}
      <style>{`
        .fp-loreband p em {
          font-style: normal;
          font-weight: 500;
          color: var(--shelf-cream, #f2e8d5);
        }
      `}</style>
      <div
        style={{
          fontFamily: 'var(--fp-font-body)',
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
          marginBottom: '0.875rem',
        }}
      >
        About This Figure
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sentences.map((sentence, i) => (
          <p
            key={i}
            style={{
              fontFamily: 'var(--fp-font-body)',
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: 1.7,
              color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
              margin: 0,
            }}
            dangerouslySetInnerHTML={{ __html: renderSentenceToHtml(sentence) }}
          />
        ))}
      </div>
    </section>
  )
}
