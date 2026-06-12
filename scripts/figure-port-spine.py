# Figure page port — spine patches for FigureDetailContent.tsx.
# Anchored slice patches (no Edit tool). Preserves all data plumbing,
# SEO, affiliate and flag logic; presentation-routing changes only.
import sys

P = r'C:\Users\bubs9\figurepinner-site\src\app\figure\[figure_id]\_components\FigureDetailContent.tsx'

with open(P, 'rb') as f:
    t = f.read().decode('utf-8')

NL = '\r\n' if '\r\n' in t else '\n'

def must(cond, msg):
    if not cond:
        print('ANCHOR FAIL: ' + msg)
        sys.exit(1)

# ── 1. placard ticks + last sale, computed after the valuePricing IIFE ─────────
anchor = """  // ── MarketPanel props ───────────────────────────────────────────────────────"""
must(anchor in t, 'marketpanel comment')
insert = NL.join([
    "  // ── Placard extras (shelf hero) ─────────────────────────────────────────────",
    "  // Range-bar ticks: recent comp prices normalized into [low, high].",
    "  const placardTicks = (() => {",
    "    if (!price || !valuePricing || valuePricing.low == null || valuePricing.high == null) return []",
    "    const lo = valuePricing.low, hi = valuePricing.high",
    "    if (hi <= lo) return []",
    "    return price.soldHistory.slice(0, 30)",
    "      .map(s => (s.price - lo) / (hi - lo))",
    "      .filter(v => v >= -0.02 && v <= 1.02)",
    "      .map(v => Math.min(1, Math.max(0, v)))",
    "  })()",
    "  // Most recent individual sale — picked by max sold_date (same trust level",
    "  // as the existing 'Latest sold comp' line; order of recent[] is not trusted).",
    "  const lastSale = (() => {",
    "    if (!price || !price.soldHistory.length) return null",
    "    let best: { price: number; sold_date?: string } | null = null",
    "    for (const s of price.soldHistory) {",
    "      if (!s.sold_date) continue",
    "      if (!best || String(s.sold_date) > String(best.sold_date)) best = s",
    "    }",
    "    return best ? { price: best.price } : null",
    "  })()",
    "",
    "",
])
t = t.replace(anchor, insert + anchor, 1)

# ── 2. shelf tokens scoped on the page root ───────────────────────────────────
old_root = """    <div style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>"""
must(old_root in t, 'root div')
new_root = """    <div className="fp-shelf" style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>"""
t = t.replace(old_root, new_root, 1)

old_style_head = """      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {"""
must(old_style_head in t, 'style block head')
new_style_head = """      {/* Shelf design tokens (scoped) + responsive overrides */}
      <style>{`
        .fp-shelf {
          --shelf-cream:     #f2e8d5;
          --shelf-cream-dim: rgba(242,232,213,0.60);
          --shelf-cream-mut: rgba(242,232,213,0.38);
          --shelf-gold:      #e0a83e;
          --shelf-gold-hi:   #f5c462;
          --shelf-line:      rgba(242,232,213,0.08);
          --shelf-line-gold: rgba(224,168,62,0.20);
          --shelf-mount:     linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%);
        }
        @media (max-width: 768px) {"""
t = t.replace(old_style_head, new_style_head, 1)

# drop the now-dead ValueStrip wrap rule (placard replaced the strip)
old_vs = """        /* Value strip responsive rules.
           At 769–900px viewport the hero is still 2-col but the identity
           column is only ~400–470px wide — too narrow for 4 equal cells
           without clipping the CONFIDENCE label. Wrap to 2×2 at 900px.
           At ≤640px the hero has already collapsed to 1-col so the strip
           is full-width; 2×2 still applies for comfortable reading. */
        @media (max-width: 900px) {
          .fp-value-strip { grid-template-columns: repeat(2, 1fr) !important; }
        }
"""
must(old_vs.replace('\n', '') .strip() != '', 'vs rule nonempty')
if old_vs in t:
    t = t.replace(old_vs, '', 1)
else:
    # CRLF variant
    old_vs_crlf = old_vs.replace('\n', '\r\n')
    must(old_vs_crlf in t, 'value strip rule')
    t = t.replace(old_vs_crlf, '', 1)

# ── 3. HeroBand call: lore + ticks + lastSale; drop dead valueStripClassName ──
old_hero = """            valuePricing={valuePricing}
            valueStripClassName="fp-value-strip"
          />"""
must(old_hero in t, 'hero props')
new_hero = """            valuePricing={valuePricing}
            loreText={local.match_represented ?? null}
            ticks={placardTicks}
            lastSale={lastSale}
          />"""
t = t.replace(old_hero, new_hero, 1)

# ── 4. FigureEnrichment: match sentence moved into the hero ───────────────────
old_enr = """          <FigureEnrichment
            matchRepresented={local.match_represented}
            keyFeatures={local.key_features}
          />"""
must(old_enr in t, 'enrichment props')
new_enr = """          {/* match_represented renders in the hero lore slot now — features only here */}
          <FigureEnrichment
            matchRepresented={null}
            keyFeatures={local.key_features}
          />"""
t = t.replace(old_enr, new_enr, 1)

# ── 5. Related-row labels → approved IA names ─────────────────────────────────
old_l1 = "label={`Others In ${line}${seriesNum ? ` Series ${seriesNum}` : ''}`}"
must(old_l1 in t, 'series label')
t = t.replace(old_l1, "label={`Complete the Wave — ${line}${seriesNum ? ` Series ${seriesNum}` : ''}`}", 1)

old_l2 = "label={`More ${characterH1} Figures`}"
must(old_l2 in t, 'variant label')
t = t.replace(old_l2, "label={`Every Version of ${characterH1}`}", 1)

with open(P, 'wb') as f:
    f.write(t.encode('utf-8'))

tail = t[-30:].strip()
ok = tail.endswith('}') or tail.endswith(')') or tail.endswith(';')
print('spine patched, tail ok:', ok)
sys.exit(0 if ok else 1)
