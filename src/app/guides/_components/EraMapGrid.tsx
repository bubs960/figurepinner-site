/**
 * EraMapGrid — the PARENT-page navigation module for the general wrestling hub (S41).
 *
 * The general wrestling-hub is a PARENT landing page, NOT a figure-list (cannibalization
 * law: the Elite + Jakks child hubs own their manufacturers' figures, so the parent must
 * NOT re-list them — it LINKS DOWN). This grid is that "pick your era" map: one card per
 * era/manufacturer bucket, each routing to a child hub (internal /guides/* link) or, for
 * makers with no child hub yet, to a scoped /search. Pure SSR, no client JS, crawlable
 * internal links (the SEO point of the parent page). Decorative only via CSS vars scoped
 * to [data-fandom="wrestling"]; legal-neutral (no marks).
 */

export type EraCard = {
  title: string       // e.g. "Mattel Elite"
  era: string         // e.g. "2010–now"
  count?: string      // optional real KB count string, e.g. "~1,400 figures"
  blurb: string       // one-line collector lore
  href: string        // child hub (/guides/...) or scoped /search
  cta: string         // link label, e.g. "Enter the Elite hub →"
}

export default function EraMapGrid({ title, sub, cards }: { title: string; sub: string; cards: EraCard[] }) {
  return (
    <section className="fh-eramap" aria-labelledby="fh-eramap-h">
      <div className="fh-eramap-head">
        <h2 id="fh-eramap-h" className="fh-eramap-title">{title}</h2>
        <p className="fh-eramap-sub">{sub}</p>
      </div>
      <div className="fh-eramap-grid">
        {cards.map((c) => (
          <a key={c.title} href={c.href} className="fh-eracard">
            <span className="fh-eracard-era">{c.era}</span>
            <span className="fh-eracard-title">{c.title}</span>
            {c.count && <span className="fh-eracard-count">{c.count}</span>}
            <span className="fh-eracard-blurb">{c.blurb}</span>
            <span className="fh-eracard-cta">{c.cta}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
