import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'FigurePinner Privacy Policy — how we collect, use, and protect your information.',
  robots: { index: true, follow: false },
}

export default function PrivacyPage() {
  const updated = 'April 2024'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', color: 'var(--text)', textDecoration: 'none' }}>
          FIGUREPINNER
        </a>
        <a href="/app" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Back to app</a>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          PRIVACY POLICY
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '3rem' }}>
          Last updated: {updated}
        </p>

        <ProseSection title="Overview">
          <p>FigurePinner (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates figurepinner.com and the FigurePinner Chrome Extension. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our services.</p>
          <p>By using FigurePinner, you agree to the collection and use of information in accordance with this policy. If you disagree, please do not use the service.</p>
        </ProseSection>

        <ProseSection title="Information We Collect">
          <h3>Account Information</h3>
          <p>When you create an account, we collect your email address and any profile information you provide through our authentication provider, Clerk. We do not store passwords — authentication is handled entirely by Clerk. See <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">Clerk&apos;s Privacy Policy</a> for details on how they handle your credentials.</p>

          <h3>Usage Data</h3>
          <p>We collect information about how you use FigurePinner, including:</p>
          <ul>
            <li>Figures you search for, add to your Wantlist, or track in your Vault</li>
            <li>Price alert preferences and thresholds you set</li>
            <li>Browser type, operating system, and general geographic region</li>
            <li>Pages visited and features used within the app</li>
          </ul>

          <h3>Chrome Extension</h3>
          <p>The FigurePinner Chrome Extension scans product pages on supported retail and resale sites (eBay, Amazon, Target, Walmart, and others) to match listings against our figure database. The extension:</p>
          <ul>
            <li>Reads page content on supported domains to identify action figure listings</li>
            <li>Does <strong>not</strong> collect or transmit your browsing history to our servers</li>
            <li>Does <strong>not</strong> read page content on non-shopping websites</li>
            <li>Sends matched figure data to our API to retrieve pricing — this does not include the full page URL or personal identifiers</li>
          </ul>
        </ProseSection>

        <ProseSection title="How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve FigurePinner</li>
            <li>Power your Wantlist, Vault, and price alert features</li>
            <li>Send price alert notifications you have configured</li>
            <li>Respond to support requests</li>
            <li>Analyze aggregate usage patterns to improve our matching accuracy and figure database</li>
            <li>Prevent fraud and abuse</li>
          </ul>
          <p>We do <strong>not</strong> sell your personal information to third parties. We do not use your data for advertising targeting.</p>
        </ProseSection>

        <ProseSection title="Affiliate Links & Third-Party Services">
          <p>FigurePinner displays links to eBay listings. Some of these links are affiliate links through the eBay Partner Network. When you click an affiliate link and make a purchase, we may earn a commission at no extra cost to you. These commissions help support the development of FigurePinner.</p>
          <p>Clicking an eBay affiliate link sends you to eBay, which has its own privacy policy and data practices. FigurePinner does not receive any personal information from eBay as a result of these clicks.</p>
          <p>We also use the following third-party services:</p>
          <ul>
            <li><strong>Clerk</strong> — authentication and user management</li>
            <li><strong>Cloudflare</strong> — hosting, CDN, and edge computing</li>
            <li><strong>eBay Partner Network</strong> — affiliate link tracking</li>
          </ul>
        </ProseSection>

        <ProseSection title="Data Storage & Security">
          <p>Your data is stored on Cloudflare&apos;s infrastructure. We implement industry-standard security measures including TLS encryption for all data in transit. Access to production data is restricted to authorized personnel.</p>
          <p>While we take reasonable precautions to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.</p>
        </ProseSection>

        <ProseSection title="Data Retention">
          <p>We retain your account and usage data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are legally required to retain it.</p>
          <p>Aggregated, anonymized analytics data (e.g., total searches per figure) may be retained indefinitely as it cannot be traced back to individual users.</p>
        </ProseSection>

        <ProseSection title="Your Rights">
          <p>Depending on your location, you may have rights under applicable privacy laws including:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
            <li><strong>Objection:</strong> Object to certain types of processing</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:privacy@figurepinner.com">privacy@figurepinner.com</a>. We will respond within 30 days.</p>
        </ProseSection>

        <ProseSection title="Children's Privacy">
          <p>FigurePinner is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us and we will delete it promptly.</p>
        </ProseSection>

        <ProseSection title="Cookies">
          <p>FigurePinner uses essential cookies to maintain your login session (managed by Clerk). We do not use advertising or tracking cookies. You can control cookies through your browser settings, though disabling essential cookies may break authentication.</p>
        </ProseSection>

        <ProseSection title="Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date. Your continued use of FigurePinner after changes constitutes acceptance of the updated policy.</p>
        </ProseSection>

        <ProseSection title="Contact">
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <p>
            <strong>FigurePinner</strong><br />
            <a href="mailto:privacy@figurepinner.com">privacy@figurepinner.com</a>
          </p>
        </ProseSection>

      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>
          © 2024 FigurePinner · <a href="/" style={{ color: 'var(--dim)' }}>Home</a> · <a href="/pro" style={{ color: 'var(--dim)' }}>Pro</a>
        </p>
      </footer>
    </div>
  )
}

// ── Prose section helper ──────────────────────────────────────────────────────

function ProseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontSize: '1.125rem', fontWeight: '700',
        color: 'var(--text)', marginBottom: '1rem',
        paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: '1.7' }}>
        {children}
      </div>
    </section>
  )
}
