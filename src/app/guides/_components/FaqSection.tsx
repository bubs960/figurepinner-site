/**
 * FaqSection — collector FAQ for a FandomHub (Gate 3 enrichment). Adds real
 * content density + FAQPage JSON-LD (SEO). SSR'd, crawlable, content visible
 * (not gated). Every answer is theme-supplied and ledger-sourced — MOTU's set
 * lives in motuFacts.ts, GI Joe's in gijoeFacts.ts. No fabrication.
 *
 * Templatized (S40): the Q&A list + heading come in as props from the theme,
 * so the component carries no fandom-specific copy.
 */

import type { HubFaq } from '../_data/fandomHubs'
import JsonLd from '@/app/_components/JsonLd'
import { renderInlineLinks } from '../_lib/renderInlineLinks'

// FAQPage JSON-LD needs the RAW answer text (search engines don't parse our
// [[label|/path]] link syntax) — strip it back to plain prose for the schema
// while the rendered <p> below gets the real inline links.
function stripInlineLinkSyntax(text: string): string {
  return text.replace(/\[\[(.+?)\|.+?\]\]/g, '$1')
}

export default function FaqSection({ faqs, title = 'Collector questions' }: { faqs: HubFaq[]; title?: string }) {
  if (!faqs.length) return null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: stripInlineLinkSyntax(f.a) },
    })),
  }
  return (
    <section className="fh-faq" aria-labelledby="fh-faq-h">
      <JsonLd data={jsonLd} />
      <h2 id="fh-faq-h" className="fh-faq-title">{title}</h2>
      <div className="fh-faq-list">
        {faqs.map((f, i) => (
          <div key={i} className="fh-faq-item">
            <h3 className="fh-faq-q">{f.q}</h3>
            <p className="fh-faq-a">{renderInlineLinks(f.a)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
