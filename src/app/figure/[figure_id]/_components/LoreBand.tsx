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
    <section style={{
      borderLeft: '3px solid var(--fp-accent-warm)',
      background: 'var(--fp-surface-0)',
      borderRadius: `0 var(--fp-radius) var(--fp-radius) 0`,
      padding: '1.75rem 2rem',
      maxWidth: '70ch',
    }}>
      <div style={{
        fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.12em',
        color: 'var(--fp-accent-warm)', textTransform: 'uppercase',
        marginBottom: '0.875rem',
      }}>
        About This Figure
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {sentences.map((sentence, i) => (
          <p
            key={i}
            style={{ fontSize: '0.9rem', color: 'var(--fp-muted)', lineHeight: '1.65', margin: 0 }}
            dangerouslySetInnerHTML={{ __html: renderSentenceToHtml(sentence) }}
          />
        ))}
      </div>
    </section>
  )
}
