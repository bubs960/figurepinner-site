/**
 * FaqSection — collector FAQ for the MOTU hub (Gate 3 enrichment). Adds real
 * content density + FAQPage JSON-LD (SEO). Every answer is sourced from the
 * line lore (motuVaultLore) + the COLLECTOR-FACT-LEDGER — no fabrication, no
 * 2026-movie reference. SSR'd, crawlable, content visible (not gated).
 */

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Are loose vintage 1982 Masters of the Universe figures valuable?',
    a: 'It depends on completeness and card status. A loose vintage He-Man with his armor and weapon is generally a $20–$40 figure; the same figure carded in decent shape is a different order of magnitude. The value drivers are the right weapon and armor, the mini-comic, card condition for sealed examples, and the harder later-wave figures that shipped in lower quantities as the line wound down.',
  },
  {
    q: 'What are Masters of the Universe Classics (MOTUC)?',
    a: "MOTUC is the Four Horsemen-sculpted adult-collector line (roughly 2008–2018), sold almost entirely through Mattycollector's subscription-and-sale-day model. It's the line collectors usually mean by “the good stuff” — supply on individual figures was genuinely constrained, and the hard late-run figures and the Club Grayskull subset run real premiums. Mattel never published print runs, so any specific scarcity claim is an estimate, not a confirmed number.",
  },
  {
    q: 'Why are 200X (2002–2004) figures collectible?',
    a: 'The 2002–2004 200X line was cancelled mid-run, and that cancellation is the value engine. The late-wave figures that barely shipped are genuine grails for that sub-fandom, and the deeper-cut characters command real money — the same economics as a cancelled DCUC wave.',
  },
  {
    q: "What is the MOTU “vintage taint”?",
    a: "It's the fandom's nickname for the flesh-tone crotch-wash paint on the vintage figures — a running joke the community has never stopped finding funny, not a defect. It lives in the same register of collector in-humor as Castle Grayskull's famously sloppy, inconsistent factory spray paint, where no two are quite alike.",
  },
  {
    q: 'Which Masters of the Universe line is the most valuable?',
    a: "The top of the MOTU comp charts is Mondo's high-end, roughly 1/6-scale premium tier — timed-edition and deluxe pieces are the line's genuine four-figure grails, built and priced as display pieces. Below that, vintage carded examples and the harder MOTUC late-run / Club Grayskull figures command the strongest premiums.",
  },
]

export default function FaqSection() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  return (
    <section className="fh-faq" aria-labelledby="fh-faq-h">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 id="fh-faq-h" className="fh-faq-title">Collector questions</h2>
      <div className="fh-faq-list">
        {FAQS.map((f, i) => (
          <div key={i} className="fh-faq-item">
            <h3 className="fh-faq-q">{f.q}</h3>
            <p className="fh-faq-a">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
