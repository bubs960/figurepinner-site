import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FigurePinner — Action Figure Price Intelligence',
  description:
    'Wrestling pricing data already at 96% — building the same depth across all 17 genres. Full web app launches when we hit 60% coverage across the board. Install the free Chrome extension while you wait.',
  alternates: { canonical: 'https://figurepinner.com' },
  robots: { index: false, follow: false },
}

export default function ComingSoonPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="cs-root">
        <div className="cs-container">
          <a className="cs-wordmark" href="/">
            <div className="cs-wordmark-icon">FP</div>
            <div className="cs-wordmark-text">
              Figure<span>Pinner</span>
            </div>
          </a>

          <div className="cs-ext-badge">Chrome Extension Live Now</div>

          <h1 className="cs-h1">
            Never overpay for<br />
            <em className="cs-h1-action">action</em>{' '}
            <em className="cs-h1-figures">figures</em> again.
          </h1>

          <p className="cs-sub">
            Real sold prices from eBay. <strong>Wrestling pricing is at 96%</strong> already —
            we&apos;re building the same depth across the other 16 genres and opening to the public
            when we hit{' '}<strong>60% coverage across all 17</strong>.
          </p>

          <a
            className="cs-cta-ext"
            href="https://chromewebstore.google.com/detail/figurepinner-%E2%80%94-action-fig/okacelmjpogkmeejifeiemmnghlldbod"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="4" fill="white" />
              <path
                d="M10 6a4 4 0 0 1 3.464 2H17a7 7 0 1 0 0 4h-3.536A4 4 0 0 1 10 14a4 4 0 0 1 0-8z"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            Add to Chrome — It&apos;s Free
          </a>

          <div className="cs-divider">Get notified when we open</div>

          <label className="cs-form-label" htmlFor="cs-email">
            Drop your email and we&apos;ll let you know.
          </label>

          <form
            className="cs-form-row"
            id="cs-notify-form"
            action="/api/waitlist/subscribe"
            method="POST"
          >
            <input
              type="email"
              id="cs-email"
              name="email"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
            <input type="hidden" name="source" value="coming_soon" />
            <button type="submit">Notify Me</button>
          </form>

          <div className="cs-form-success" id="cs-form-success">
            ✓ You&apos;re on the list — we&apos;ll be in touch!
          </div>

          <p className="cs-form-note">No spam. One email when we launch.</p>
          <div className="cs-waitlist-count" id="cs-waitlist-count" aria-live="polite"></div>

          <div className="cs-stats">
            <div>
              <div className="cs-stat-num" style={{ color: '#0066FF' }}>
                20K+
              </div>
              <div className="cs-stat-label">Figures</div>
            </div>
            <div>
              <div className="cs-stat-num" style={{ color: '#00C870' }}>
                17
              </div>
              <div className="cs-stat-label">Genres</div>
            </div>
            <div>
              <div className="cs-stat-num" style={{ color: '#FF5F00' }}>
                Live
              </div>
              <div className="cs-stat-label">eBay Prices</div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: FORM_SCRIPT }} />
    </>
  )
}

const STYLES = `
.cs-root, .cs-root *, .cs-root *::before, .cs-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.cs-root {
  --cs-bg: #09090F; --cs-surface: #111318; --cs-border: #1E2130;
  --cs-blue: #0066FF; --cs-text: #EEEEF5; --cs-muted: #666E8A; --cs-dim: #3A3D52; --cs-green: #00C870;
  position: fixed; inset: 0; z-index: 9999;
  background: var(--cs-bg); color: var(--cs-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 2rem 1.25rem; overflow-x: hidden; overflow-y: auto;
}
.cs-root::before {
  content: ''; position: fixed; top: -200px; left: 50%; transform: translateX(-50%);
  width: 900px; height: 700px;
  background: radial-gradient(ellipse at center, rgba(0,102,255,0.14) 0%, rgba(0,102,255,0.04) 50%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.cs-container { width: 100%; max-width: 560px; text-align: center; position: relative; z-index: 1; }
.cs-wordmark { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 3rem; text-decoration: none; }
.cs-wordmark-icon {
  width: 44px; height: 44px; background: var(--cs-blue); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 900; color: #fff; letter-spacing: -0.5px; flex-shrink: 0;
}
.cs-wordmark-text { font-size: 1.6rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cs-text); }
.cs-wordmark-text span { color: var(--cs-blue); }
.cs-ext-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(0,200,112,0.1); border: 1px solid rgba(0,200,112,0.25);
  border-radius: 100px; padding: 5px 14px; font-size: 0.75rem; font-weight: 600;
  color: var(--cs-green); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 1.75rem;
}
.cs-ext-badge::before {
  content: ''; width: 6px; height: 6px; background: var(--cs-green);
  border-radius: 50%; animation: cs-pulse 2s infinite;
}
@keyframes cs-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.cs-h1 {
  font-size: clamp(2rem, 6vw, 3rem); font-weight: 900; line-height: 1.1;
  letter-spacing: -0.02em; color: var(--cs-text); margin-bottom: 1rem;
}
.cs-h1 em { font-style: normal; }
.cs-h1 .cs-h1-action { color: #E63946; }    /* red */
.cs-h1 .cs-h1-figures { color: #FFB800; }   /* gold */
.cs-sub {
  font-size: 1.05rem; color: var(--cs-muted); line-height: 1.6;
  margin-bottom: 2.5rem; max-width: 420px; margin-left: auto; margin-right: auto;
}
.cs-sub strong { color: var(--cs-text); font-weight: 700; }
.cs-cta-ext {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--cs-blue); color: #fff; font-size: 1rem; font-weight: 700;
  padding: 14px 28px; border-radius: 10px; text-decoration: none; letter-spacing: 0.01em;
  transition: background 0.15s, transform 0.15s; margin-bottom: 2.5rem;
}
.cs-cta-ext:hover { background: #0052cc; transform: translateY(-1px); }
.cs-cta-ext svg { width: 20px; height: 20px; flex-shrink: 0; }
.cs-divider {
  display: flex; align-items: center; gap: 12px; margin-bottom: 2rem;
  color: var(--cs-dim); font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase;
}
.cs-divider::before, .cs-divider::after { content: ''; flex: 1; height: 1px; background: var(--cs-border); }
.cs-form-label { font-size: 0.85rem; color: var(--cs-muted); margin-bottom: 0.75rem; display: block; }
.cs-form-row { display: flex; gap: 8px; max-width: 420px; margin: 0 auto 0.75rem; }
.cs-form-row input[type="email"] {
  flex: 1; background: var(--cs-surface); border: 1px solid var(--cs-border);
  border-radius: 8px; color: var(--cs-text); font-size: 0.95rem;
  padding: 12px 16px; outline: none; transition: border-color 0.15s; min-width: 0;
}
.cs-form-row input[type="email"]::placeholder { color: var(--cs-dim); }
.cs-form-row input[type="email"]:focus { border-color: var(--cs-blue); }
.cs-form-row button {
  background: var(--cs-surface); border: 1px solid var(--cs-border);
  border-radius: 8px; color: var(--cs-text); font-size: 0.9rem; font-weight: 600;
  padding: 12px 20px; cursor: pointer; white-space: nowrap;
  transition: border-color 0.15s, color 0.15s; letter-spacing: 0.01em;
}
.cs-form-row button:hover:not(:disabled) { border-color: var(--cs-blue); color: var(--cs-blue); }
.cs-form-row button:disabled { opacity: 0.6; cursor: not-allowed; }
.cs-form-note { font-size: 0.75rem; color: var(--cs-dim); }
.cs-waitlist-count {
  font-size: 0.78rem; color: var(--cs-muted); font-weight: 600;
  margin-top: 0.625rem; min-height: 1em; letter-spacing: 0.01em;
}
.cs-waitlist-count strong { color: var(--cs-green); font-weight: 700; }
.cs-form-success {
  display: none; align-items: center; justify-content: center; gap: 8px;
  color: var(--cs-green); font-size: 0.9rem; font-weight: 600; padding: 12px;
}
.cs-stats {
  display: flex; justify-content: center; gap: 2rem;
  margin-top: 3.5rem; padding-top: 2rem; border-top: 1px solid var(--cs-border);
}
.cs-stat-num { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.01em; }
.cs-stat-label { font-size: 0.7rem; color: var(--cs-dim); letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; margin-top: 2px; }
@media (max-width: 480px) { .cs-form-row { flex-direction: column; } .cs-stats { gap: 1.5rem; } }
`

const FORM_SCRIPT = `
(function() {
  var form = document.getElementById('cs-notify-form');
  var success = document.getElementById('cs-form-success');
  var countEl = document.getElementById('cs-waitlist-count');
  if (!form || !success) return;

  // Fetch waitlist count on load — read-only, cached at edge.
  if (countEl) {
    fetch('/api/waitlist/count')
      .then(function(res) { return res.json(); })
      .then(function(d) {
        if (d && typeof d.floored === 'number' && d.floored >= 10) {
          countEl.innerHTML = '<strong>' + d.floored + '+</strong> collectors already on the list';
        }
      })
      .catch(function() { /* silent */ });
  }
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var emailInput = form.querySelector('input[name="email"]');
    var sourceInput = form.querySelector('input[name="source"]');
    var btn = form.querySelector('button');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    fetch('/api/waitlist/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email: (emailInput && emailInput.value) || '',
        source: (sourceInput && sourceInput.value) || 'coming_soon'
      })
    })
      .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
      .then(function(r) {
        if (r.ok) {
          form.style.display = 'none';
          var label = document.querySelector('.cs-form-label');
          if (label) label.style.display = 'none';
          success.style.display = 'flex';
        } else {
          if (btn) {
            btn.disabled = false;
            btn.textContent = (r.data && r.data.error === 'invalid_email') ? 'Invalid email' : 'Try again';
          }
        }
      })
      .catch(function() {
        if (btn) { btn.disabled = false; btn.textContent = 'Try again'; }
      });
  });
})();
`
