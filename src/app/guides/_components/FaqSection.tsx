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

export default function FaqSection({ faqs, title = 'Collector questions' }: { faqs: HubFaq[]; title?: string }) {
  if (!faqs.length) return null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  return (
    <section className="fh-faq" aria-labelledby="fh-faq-h">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 id="fh-faq-h" className="fh-faq-title">{title}</h2>
      <div className="fh-faq-list">
        {faqs.map((f, i) => (
          <div key={i} className="fh-faq-item">
            <h3 className="fh-faq-q">{f.q}</h3>
            <p className="fh-faq-a">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
