// renderInlineLinks — shared `[[label|/path]]` inline-link parser for guide prose.
// Extracted 2026-08-15 (guides-conversion Phase 5): was duplicated verbatim in
// FandomHub.tsx and guides/[slug]/page.tsx; FaqSection.tsx is the third consumer
// (figure-page links in FAQ answers), which is what made the duplication worth
// collapsing now rather than adding a fourth copy.

import type { ReactNode } from 'react'

export function renderInlineLinks(text: string): ReactNode {
  const parts: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = /\[\[(.+?)\|(.+?)\]\]/g
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={`t${match.index}`}>{text.slice(last, match.index)}</span>)
    parts.push(
      <a key={`a${match.index}`} href={match[2]} style={{ color: 'var(--fp-accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
        {match[1]}
      </a>,
    )
    last = match.index + match[0].length
  }
  if (parts.length === 0) return text
  if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>)
  return <>{parts}</>
}
