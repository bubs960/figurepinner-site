// FigurePinner Landing Page
// Source of truth: /docs/landing-page.html (designer's canonical spec)
// Phase 1: Static marketing page only. No API calls. No auth gates.
// All links to Chrome Web Store and /sign-up are placeholders until Phase 2.

import type { CSSProperties, ReactNode } from 'react'

const CWS_URL = 'https://chromewebstore.google.com/detail/figurepinner-%E2%80%94-action-fig/okacelmjpogkmeejifeiemmnghlldbod'
const SIGNUP_URL = '/sign-up'

export default function HomePage() {
  return (
    <>
      {/* ─── NAV ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(9,9,15,.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '.06em', textDecoration: 'none', color: 'var(--text)' }} href="/">
          Figure<span style={{ color: 'var(--blue)' }}>Pinner</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#companion" style={navLinkStyle}>Whatnot Companion</a>
          <a href="#wantlist" style={navLinkStyle}>Wantlist</a>
          <a href="#library" style={navLinkStyle}>Library</a>
          <a href="#pricing" style={navLinkStyle}>Free</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href={SIGNUP_URL} style={btnNavGhostStyle}>Log In</a>
          <a href={CWS_URL} target="_blank" rel="noopener noreferrer" style={btnNavPrimaryStyle}>
            <ArrowIcon /> Install Free
          </a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 80px',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 600,
          background: 'radial-gradient(ellipse at center,rgba(0,102,255,.12) 0%,rgba(0,102,255,.04) 40%,transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={heroEyebrowStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
          Live on Whatnot · Chrome Extension · Free
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(3.5rem,9vw,7rem)',
          letterSpacing: '.02em', lineHeight: 1, marginBottom: 12, maxWidth: 900,
        }}>
          Hunt Smarter.<br />
          <span style={{ color: 'var(--blue)' }}>Collect More.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem,2vw,1.25rem)', color: 'var(--muted)',
          maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.6,
        }}>
          Real-time price data for 20,000+ action figures. Know what any figure is worth before you bid — right inside Whatnot, eBay, or anywhere you collect.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
          <a href={CWS_URL} target="_blank" rel="noopener noreferrer" style={btnHeroPrimaryStyle}>
            <PlusBoxIcon /> Add to Chrome — It&apos;s Free
          </a>
          <a href={SIGNUP_URL} style={btnHeroSecondaryStyle}>
            Create Free Account →
          </a>
        </div>

        <div style={{ fontSize: 11, color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 60, flexWrap: 'wrap' }}>
          <span>20,000+ figures</span>
          <TrustSep />
          <span>96% price coverage</span>
          <TrustSep />
          <span>200K items/day</span>
          <TrustSep />
          <span>17 genres</span>
          <TrustSep />
          <span>Free forever</span>
        </div>

        {/* ─── HERO MOCKUP ─── */}
        <div style={{
          width: '100%', maxWidth: 900, margin: '0 auto',
          background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04)',
        }}>
          {/* Browser chrome bar */}
          <div style={{ height: 36, background: 'var(--s2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F5F' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFB800' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C870' }} />
            <div style={{ flex: 1, background: 'var(--s3)', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: 'var(--muted)', marginLeft: 12, maxWidth: 280 }}>
              figurepinner.com/companion
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />96% Live
            </div>
          </div>

          {/* Mockup content */}
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 16, height: 440, overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dim)', padding: '0 12px 8px' }}>Main</div>
              <div style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--blue)', background: 'rgba(0,102,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>⚡ Companion</div>
              <div style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--orange)', background: 'rgba(255,95,0,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ★ Wantlist
                <span style={{ marginLeft: 'auto', background: 'rgba(255,95,0,0.08)', color: 'var(--orange)', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 9999 }}>12</span>
              </div>
              <div style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>▦ Vault</div>
              <div style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>🏷 Deals</div>
              <div style={{ marginTop: 12, fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dim)', padding: '0 12px 8px' }}>Discover</div>
              <div style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>📚 Library</div>
              <div style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>🔍 Browse</div>
            </div>

            {/* Main panel */}
            <div>
              <div style={{ background: 'var(--s2)', border: '1px solid rgba(0,102,255,0.25)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Quick Price Check
                  <span style={{ background: 'rgba(0,200,112,0.08)', border: '1px solid rgba(0,200,112,0.25)', borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--green)' }}>96% Coverage</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--muted)' }}>
                  <span style={{ fontSize: 14 }}>🔍</span>
                  <span>Macho Man Randy Savage Mattel</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: 'var(--s2)', padding: '2px 6px', borderRadius: 4, color: 'var(--dim)' }}>Ctrl+K</span>
                </div>
                <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🤼</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Macho Man Randy Savage</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>WWE · Mattel · Ultimate Edition · 2024</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: 'rgba(0,200,112,0.08)', border: '1px solid rgba(0,200,112,0.25)', borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: 'var(--green)', flexShrink: 0 }}>98% match</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border)' }}>
                    <PriceCol value="$47" label="Last Sold" />
                    <PriceCol value="$52" label="Avg 90d" borderLeft />
                    <PriceCol value="$38" label="Good Deal" color="var(--green)" borderLeft />
                  </div>
                  <div style={{ padding: 10, display: 'flex', gap: 6 }}>
                    <MockBtn color="var(--green)" bg="rgba(0,200,112,0.08)" border="rgba(0,200,112,0.25)">✓ Owned</MockBtn>
                    <MockBtn color="var(--orange)" bg="rgba(255,95,0,0.1)" border="rgba(255,95,0,0.25)">★ Want</MockBtn>
                    <MockBtn color="#fff" bg="var(--blue)" border="transparent">Find It →</MockBtn>
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--orange)', flexShrink: 0 }}>🔥 Hot Deal</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', flex: 1 }}>Spider-Man Retro Series — listing just dropped</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>$24</div>
                <div style={{ background: 'var(--blue)', borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 800, color: '#fff', cursor: 'pointer' }}>View →</div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dim)', marginBottom: 10 }}>Wantlist Progress</div>
                <WantlistRow pct={83} pctLabel="83%" color="var(--green)" name="Ultimate Edition" sub="🔥 1 away" subColor="var(--orange)" />
                <WantlistRow pct={50} pctLabel="50%" color="var(--blue)" name="Marvel Legends Retro" sub="4/8 figures" />
                <WantlistRow pct={17} pctLabel="17%" color="var(--orange)" name="Transformers SS86" sub="1/6 figures" noMargin />
              </div>
              <div style={{ background: 'var(--s2)', border: '1px solid rgba(0,200,112,0.25)', borderLeft: '3px solid var(--green)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>↓ Price Drop</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Macho Man Ultimate Ed.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>$34</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textDecoration: 'line-through', marginLeft: 4 }}>$52</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', background: 'rgba(0,200,112,0.08)', borderRadius: 9999, padding: '1px 6px', marginLeft: 4 }}>↓33%</div>
                </div>
                <div style={{ background: 'var(--blue)', borderRadius: 6, padding: 6, fontSize: 10, fontWeight: 800, color: '#fff', textAlign: 'center', marginTop: 8, cursor: 'pointer' }}>Find It →</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <StatItem num="20K+" numColor="var(--blue)" label="Figures in Database" />
        <StatItem num="96%" numColor="var(--green)" label="Price Coverage" />
        <StatItem num="200K" numColor="var(--orange)" label="Items Processed / Day" />
        <StatItem num="17" numColor="var(--blue)" label="Genres Covered" />
        <StatItem num="<200ms" numColor="var(--green)" label="Price Lookup Speed" last />
      </div>

      {/* ─── SECTION: WHATNOT COMPANION ─── */}
      <section id="companion" style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={eyebrowStyle('var(--green)')}>Live on Whatnot · Right Now</div>
            <h2 style={sectionTitleStyle}>Your Price Intel.<br />On Every Stream.</h2>
            <p style={sectionSubStyle}>
              Stream&apos;s running. Seller holds up a figure. You&apos;ve got 15 seconds. Hit Ctrl+K, type the name — FigurePinner pulls the real eBay sold data from our live database and tells you exactly what it&apos;s worth. No switching tabs. No guessing.
            </p>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FeatureBullet icon="⚡" bg="rgba(0,200,112,0.08)" border="rgba(0,200,112,0.25)" title="Ctrl+K anywhere" desc="Works on Whatnot, eBay, anywhere in your browser. One shortcut." />
              <FeatureBullet icon="💾" bg="rgba(0,102,255,0.1)" border="rgba(0,102,255,0.25)" title="Live D1 database" desc="96% of figures have real sold price data, updated every 6 hours from eBay." />
              <FeatureBullet icon="🎯" bg="rgba(255,95,0,0.08)" border="rgba(255,95,0,0.25)" title="Bid with confidence" desc="Last sold price, 90-day average, and deal threshold shown instantly." />
            </div>
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
            <div style={{ background: 'var(--bg)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,200,112,0.08)', border: '1px solid rgba(0,200,112,0.25)', borderRadius: 9999, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  Live on Whatnot
                </div>
                <div style={{ marginLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Quick Price Check</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>D1 database · &lt;200ms</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                  Press <span style={{ background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: 'var(--dim)' }}>Ctrl+K</span>
                </div>
              </div>
              <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', border: '1.5px solid rgba(0,102,255,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, boxShadow: '0 0 0 3px rgba(0,102,255,.08)' }}>
                  <span style={{ fontSize: 14, opacity: .5 }}>🔍</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>Macho Man Mattel Ultimate</span>
                  <span style={{ width: 1, height: 14, background: 'var(--blue)', display: 'inline-block' }} />
                </div>
                <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤼</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Macho Man Randy Savage</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>WWE · Mattel · Ultimate Edition</div>
                    </div>
                    <div style={{ background: 'rgba(0,200,112,0.08)', border: '1px solid rgba(0,200,112,0.25)', borderRadius: 9999, padding: '3px 10px', fontSize: 10, fontWeight: 800, color: 'var(--green)' }}>98% match</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)' }}>
                    <CompPriceCol value="$47" label="Last Sold" />
                    <CompPriceCol value="$52" label="Avg 90d" borderLeft />
                    <CompPriceCol value="$38" label="Good Deal" color="var(--green)" borderLeft />
                  </div>
                  <div style={{ padding: 10, display: 'flex', gap: 6 }}>
                    <MockBtn color="var(--green)" bg="rgba(0,200,112,0.08)" border="rgba(0,200,112,0.25)">✓ Mark Owned</MockBtn>
                    <MockBtn color="var(--orange)" bg="rgba(255,95,0,0.1)" border="rgba(255,95,0,0.25)">★ Add to Wantlist</MockBtn>
                    <MockBtn color="#fff" bg="var(--blue)" border="transparent">Find It →</MockBtn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION: SERIES COMPLETION ─── */}
      <div id="wantlist" style={{ padding: '100px 0', background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={sectionInnerStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,.5)', order: -1 }}>
              <div style={{ background: 'var(--bg)', padding: 20 }}>
                <div style={{ background: 'var(--s1)', border: '1.5px solid rgba(0,200,112,.3)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 0 20px rgba(0,200,112,.06)' }}>
                  <div style={{ background: 'linear-gradient(90deg,rgba(255,95,0,.15),rgba(255,95,0,.05))', borderBottom: '1px solid rgba(255,95,0,.2)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, color: 'var(--orange)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} />
                    🔥 1 Figure Away From Complete
                    <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Series Slayer 4/5</div>
                  </div>
                  <div style={{ padding: '14px 14px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                        <circle fill="none" stroke="var(--s3)" strokeWidth="4" cx="26" cy="26" r="20" />
                        <circle fill="none" stroke="var(--green)" strokeWidth="4" cx="26" cy="26" r="20" strokeDasharray="125.7" strokeDashoffset="21.4" strokeLinecap="round" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, lineHeight: 1.1 }}>
                        83%<sub style={{ fontSize: 8, color: 'var(--muted)', fontStyle: 'normal' }}>5/6</sub>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Ultimate Edition · 2024</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>WWE · Mattel · 6 figures</div>
                      <div style={{ height: 3, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--green)', borderRadius: 2, width: '83%' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 5, padding: '0 14px 14px' }}>
                    {['🤼','💪','🐍','⚡','🦅'].map((emoji, i) => (
                      <div key={i} style={{ borderRadius: 8, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: 'rgba(0,200,112,0.08)', border: '1px solid rgba(0,200,112,0.3)', position: 'relative' }}>
                        {emoji}
                        <span style={{ position: 'absolute', top: 1, right: 2, fontSize: 8, fontWeight: 900, color: 'var(--green)' }}>✓</span>
                      </div>
                    ))}
                    <div style={{ borderRadius: 8, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, opacity: .6, background: 'rgba(255,95,0,.1)', border: '1.5px solid var(--orange)', position: 'relative' }}>
                      👊
                      <span style={{ position: 'absolute', bottom: 2, fontSize: 8, fontWeight: 800, color: 'var(--orange)' }}>$47</span>
                    </div>
                  </div>
                  <button style={{ margin: '0 14px 14px', background: 'var(--green)', border: 'none', borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 800, color: '#000', width: 'calc(100% - 28px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    🏷️ 1 Figure Left — Find It Now →
                  </button>
                </div>
                <div style={{ marginTop: 12, background: 'var(--s1)', border: '1px solid rgba(0,200,112,.25)', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20 }}>🏆</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)' }}>Series Slayer — 1 set away</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Complete 5 full sets. You&apos;re at 4.</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'rgba(255,95,0,0.08)', border: '1px solid rgba(255,95,0,0.25)', borderRadius: 9999, padding: '3px 10px', fontSize: 10, fontWeight: 800, color: 'var(--orange)' }}>4/5</div>
                </div>
              </div>
            </div>
            <div>
              <div style={eyebrowStyle('var(--orange)')}>Wantlist · Series Completion</div>
              <h2 style={sectionTitleStyle}>One Figure<br />From <span style={{ color: 'var(--green)' }}>Glory.</span></h2>
              <p style={sectionSubStyle}>
                FigurePinner tracks every figure you own. When you&apos;re one away from completing a set, we don&apos;t just show you a grey tile — we show you exactly what it costs, how the price is moving, and the one click that completes your collection.
              </p>
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FeatureBullet icon="🔔" title="Price drop alerts on wanted figures" desc="Set a target price. We watch the market. Alert fires when it crosses your threshold." />
                <FeatureBullet icon="🏆" title="Achievements that mean something" desc="Series Slayer, Macho Man Maniac, Live Sniper — earned, not bought." />
                <FeatureBullet icon="🏷️" title="Free because of affiliate links" desc={'We earn a small commission when you click \u201cFind It \u2192\u201d. You pay the same eBay price. No ads, no subscriptions.'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <section style={sectionStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={eyebrowStyle('var(--blue)')}>The Loop</div>
          <h2 style={sectionTitleStyle}>Track. Hunt. Collect.<br />Repeat.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24, marginTop: 48 }}>
          <StepCard num="01" numColor="var(--blue)" icon="📥" title="Install the Extension" desc="One click. Works in Chrome. Adds a Ctrl+K price lookup to any page you're on." connector />
          <StepCard num="02" numColor="var(--orange)" icon="⚡" title="Look Up Any Figure" desc="Press Ctrl+K, type the name. Instant price data from 200K eBay sold listings daily." connector />
          <StepCard num="03" numColor="var(--green)" icon="📦" title="Build Your Collection" desc="Mark figures owned or wanted. We track your series completion and alert you on price drops." connector />
          <StepCard num="04" numColor="#FFB800" icon="🏆" title="Complete Sets. Earn Glory." desc="Hit 100% on a series. Watch the ring fill. Unlock achievements. Share your complete collection." />
        </div>
      </section>

      {/* ─── GENRES ─── */}
      <div id="library" style={{ padding: '100px 0', background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={sectionInnerStyle}>
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <div style={eyebrowStyle('var(--blue)')}>Library</div>
            <h2 style={sectionTitleStyle}>20,000+ Figures.<br />17 Genres.</h2>
            <p style={{ ...sectionSubStyle, margin: '0 auto' }}>From Macho Man to Star Wars to Studio Series Transformers — if it&apos;s an action figure, it&apos;s probably in here.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginTop: 40 }}>
            {GENRES.map((g) => (
              <a key={g.name} href={`/${g.slug}`} style={genreCardStyle}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{g.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{g.count}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <section style={sectionStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={eyebrowStyle('var(--blue)')}>Community</div>
          <h2 style={sectionTitleStyle}>Collectors Trust<br />Real Data.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 48 }}>
          <Testimonial
            text='"Had this open during a Whatnot stream and saved $28 on a Marvel Legends figure because I knew what it actually sold for. The Ctrl+K shortcut is stupid fast."'
            name="JakeMarcellino"
            handle="WWE collector · 12 complete sets"
            avatar="J"
            avatarGradient="linear-gradient(135deg,var(--blue),#0052CC)"
          />
          <Testimonial
            text='"The completion ring thing is dangerous. I finished my second Ultimate Edition set just because the "1 away" banner kept staring at me. Worth it."'
            name="KingOfKayfabe"
            handle="Mattel specialist · Series Slayer ×3"
            avatar="K"
            avatarGradient="linear-gradient(135deg,var(--orange),#CC4400)"
          />
          <Testimonial
            text='"Been flipping figures for 4 years. This is the first tool that actually shows sold comps instead of retail. 96% coverage is real — I&apos;ve only hit a miss twice."'
            name="RetroPlasticHunter"
            handle="Flipper & collector · Vault Commander"
            avatar="R"
            avatarGradient="linear-gradient(135deg,var(--green),#009950)"
          />
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <div id="pricing" style={{
        background: 'linear-gradient(135deg,rgba(0,102,255,.08) 0%,rgba(0,102,255,.03) 50%,rgba(255,95,0,.05) 100%)',
        borderTop: '1px solid var(--border)',
        padding: '120px 24px', textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,6vw,5rem)', letterSpacing: '.02em', marginBottom: 16 }}>
          Stop Guessing.<br />Start <span style={{ color: 'var(--orange)' }}>Hunting.</span>
        </h2>
        <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Free Chrome extension. No subscription. No ads. We earn when you find the figure you&apos;re missing — so your interests are our interests.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href={CWS_URL} target="_blank" rel="noopener noreferrer" style={{ ...btnHeroPrimaryStyle, fontSize: 16, padding: '16px 32px' }}>
            <PlusBoxIcon /> Add to Chrome — Free
          </a>
          <a href={SIGNUP_URL} style={{ ...btnHeroSecondaryStyle, fontSize: 15, padding: '16px 24px' }}>
            Create Account →
          </a>
        </div>
        <div style={{ marginTop: 24, fontSize: 11, color: 'var(--dim)' }}>No credit card. No subscription. Just better collecting.</div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '.06em' }}>
          Figure<span style={{ color: 'var(--blue)' }}>Pinner</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'About',                href: '/about' },
            { label: 'Privacy',              href: '/privacy' },
            { label: 'Terms',                href: '/terms' },
            { label: 'Chrome Extension',     href: CWS_URL },
            { label: 'Contact',              href: 'mailto:hello@figurepinner.com' },
            { label: 'Affiliate Disclosure', href: '/privacy#affiliate' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)' }}>© 2026 Bubs960 Collectibles · FigurePinner</div>
      </footer>

      {/* CSS animations (inline since we can't do keyframes in inline styles) */}
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes hot-tile { 0%,100%{box-shadow:0 0 0 0 rgba(255,95,0,0)} 50%{box-shadow:0 0 10px 2px rgba(255,95,0,.2)} }
        @media(max-width:960px){
          #companion > div, #wantlist .section-inner { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media(max-width:640px){
          .mockup-sidebar, .mock-right-col { display: none !important; }
          .mockup-grid { grid-template-columns: 1fr !important; height: auto !important; }
        }
      `}</style>
    </>
  )
}

// ─── Shared style objects ─────────────────────────────────────────────────

const navLinkStyle: CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--muted)', textDecoration: 'none',
}

const btnNavGhostStyle: CSSProperties = {
  padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 10,
  fontSize: 13, fontWeight: 600, color: 'var(--muted)', textDecoration: 'none', background: 'transparent',
}

const btnNavPrimaryStyle: CSSProperties = {
  padding: '8px 18px', border: 'none', borderRadius: 10,
  fontSize: 13, fontWeight: 800, background: 'var(--blue)', color: '#fff', textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', gap: 6,
}

const btnHeroPrimaryStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'var(--blue)', border: 'none', borderRadius: 10,
  padding: '14px 28px', fontSize: 15, fontWeight: 800, color: '#fff', textDecoration: 'none', cursor: 'pointer',
}

const btnHeroSecondaryStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
  padding: '14px 24px', fontSize: 15, fontWeight: 600, color: 'var(--muted)', textDecoration: 'none', cursor: 'pointer',
}

const heroEyebrowStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.25)',
  borderRadius: 9999, padding: '5px 14px',
  fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
  color: 'var(--blue)', marginBottom: 24,
}

const sectionStyle: CSSProperties = {
  padding: '100px 24px', maxWidth: 1200, margin: '0 auto',
}

const sectionInnerStyle: CSSProperties = {
  maxWidth: 1200, margin: '0 auto', padding: '0 24px',
}

const sectionTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem,5vw,3.5rem)',
  letterSpacing: '.03em', lineHeight: 1.05, marginBottom: 16,
}

const sectionSubStyle: CSSProperties = {
  fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 520,
}

const genreCardStyle: CSSProperties = {
  background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 10,
  padding: 16, textAlign: 'center', cursor: 'pointer', textDecoration: 'none', display: 'block',
}

function eyebrowStyle(color: string): CSSProperties {
  return { fontSize: 10, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color, marginBottom: 12 }
}

// ─── Sub-components ───────────────────────────────────────────────────────

function TrustSep() {
  return <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--dim)' }} />
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 8h8M8 4l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusBoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="#fff" strokeWidth="1.5" />
      <path d="M8 5v6M5 8h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function StatItem({ num, numColor, label, last }: { num: string; numColor: string; label: string; last?: boolean }) {
  return (
    <div style={{ padding: '12px 40px', textAlign: 'center', borderRight: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '.04em', lineHeight: 1, marginBottom: 4, color: numColor }}>{num}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.04em' }}>{label}</div>
    </div>
  )
}

function PriceCol({ value, label, color, borderLeft }: { value: string; label: string; color?: string; borderLeft?: boolean }) {
  return (
    <div style={{ padding: 12, textAlign: 'center', borderLeft: borderLeft ? '1px solid var(--border)' : undefined }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color ?? 'var(--text)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

function CompPriceCol({ value, label, color, borderLeft }: { value: string; label: string; color?: string; borderLeft?: boolean }) {
  return (
    <div style={{ padding: 10, textAlign: 'center', borderLeft: borderLeft ? '1px solid var(--border)' : undefined }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: color ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
    </div>
  )
}

function MockBtn({ children, color, bg, border }: { children: ReactNode; color: string; bg: string; border: string }) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 7, padding: 7, fontSize: 10, fontWeight: 700, color, textAlign: 'center', cursor: 'pointer' }}>
      {children}
    </div>
  )
}

function WantlistRow({ pct, pctLabel, color, name, sub, subColor, noMargin }: {
  pct: number; pctLabel: string; color: string; name: string; sub: string; subColor?: string; noMargin?: boolean
}) {
  const r = 12
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: noMargin ? 0 : 8 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle fill="none" stroke="var(--s3)" strokeWidth="3" cx="16" cy="16" r={r} />
          <circle fill="none" stroke={color} strokeWidth="3" cx="16" cy="16" r={r} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 16 16)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800 }}>{pctLabel}</div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 10, color: subColor ?? 'var(--muted)', fontWeight: subColor ? 700 : 400 }}>{sub}</div>
      </div>
    </div>
  )
}

function FeatureBullet({ icon, title, desc, bg, border }: { icon: string; title: string; desc: string; bg?: string; border?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg ?? 'var(--s2)', border: `1px solid ${border ?? 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
      </div>
    </div>
  )
}

function StepCard({ num, numColor, icon, title, desc, connector }: { num: string; numColor: string; icon: string; title: string; desc: string; connector?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16, position: 'relative' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', lineHeight: 1, marginBottom: 12, color: numColor }}>{num}</div>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div>
      {connector && <div style={{ position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)', fontSize: 18, color: 'var(--dim)', zIndex: 1 }}>→</div>}
    </div>
  )
}

function Testimonial({ text, name, handle, avatar, avatarGradient }: { text: string; name: string; handle: string; avatar: string; avatarGradient: string }) {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
      <div style={{ color: 'var(--orange)', fontSize: 14, marginBottom: 10, letterSpacing: 2 }}>★★★★★</div>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 14, fontStyle: 'italic' }}>{text}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: avatarGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {avatar}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{handle}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────

const GENRES = [
  { emoji: '🤼', name: 'Wrestling',          slug: 'wrestling',                    count: '8,000+ figures' },
  { emoji: '🦸', name: 'Marvel',             slug: 'marvel',                       count: '3,800+ figures' },
  { emoji: '⚔️', name: 'Star Wars',          slug: 'star-wars',                    count: '2,600+ figures' },
  { emoji: '🦇', name: 'DC',                 slug: 'dc',                           count: '1,900+ figures' },
  { emoji: '🤖', name: 'Transformers',       slug: 'transformers',                 count: '2,100+ figures' },
  { emoji: '🪖', name: 'G.I. Joe',           slug: 'gijoe',                        count: '1,400+ figures' },
  { emoji: '⚡', name: 'MOTU',               slug: 'masters-of-the-universe',      count: '800+ figures'   },
  { emoji: '🐢', name: 'TMNT',               slug: 'teenage-mutant-ninja-turtles', count: '900+ figures'   },
  { emoji: '🦕', name: 'Power Rangers',      slug: 'power-rangers',                count: '1,200+ figures' },
  { emoji: '🎩', name: 'Indiana Jones',      slug: 'indiana-jones',                count: '400+ figures'   },
  { emoji: '👻', name: 'Ghostbusters',       slug: 'ghostbusters',                 count: '600+ figures'   },
  { emoji: '🗡️', name: 'Mythic Legions',     slug: 'mythic-legions',               count: '500+ figures'   },
  { emoji: '🐱', name: 'Thundercats',        slug: 'thundercats',                  count: '200+ figures'   },
  { emoji: '🎖️', name: 'Action Force',       slug: 'action-force',                 count: '150+ figures'   },
  { emoji: '🐉', name: 'D&D',               slug: 'dungeons-dragons',             count: '350+ figures'   },
  { emoji: '🎬', name: 'Horror & Film',      slug: 'neca',                         count: '700+ figures'   },
  { emoji: '🦇', name: 'Spawn',              slug: 'spawn',                        count: '300+ figures'   },
]
