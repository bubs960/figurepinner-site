'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserProfile, useUser } from '@clerk/nextjs'

type NotifPrefs = {
  dealAlerts: boolean
  weeklyDigest: boolean
  genreAnnouncements: boolean
}

const DEFAULT_PREFS: NotifPrefs = { dealAlerts: false, weeklyDigest: false, genreAnnouncements: true }

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const IS_PRO = isLoaded ? ((user?.publicMetadata?.isPro as boolean) ?? false) : false

  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  // Load prefs from server on mount
  useEffect(() => {
    fetch('/api/user-settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: NotifPrefs | null) => { if (d) setPrefs(d) })
      .catch(() => { /* use defaults */ })
      .finally(() => setPrefsLoading(false))
  }, [])

  async function openBillingPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      }
    } catch { /* silently fail */ }
    finally { setPortalLoading(false) }
  }

  const savePrefs = useCallback(async (next: NotifPrefs) => {
    setPrefsSaving(true)
    try {
      await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
    } catch { /* silently fail */ }
    finally { setPrefsSaving(false) }
  }, [])

  function togglePref(key: keyof NotifPrefs) {
    if (key === 'dealAlerts' && !IS_PRO) return // locked
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] }
      savePrefs(next)
      return next
    })
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', marginBottom: '2rem' }}>
        SETTINGS
      </h1>

      {/* Subscription status */}
      <Section title="Subscription">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', background: 'var(--s2)', borderRadius: '8px', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
              {IS_PRO
                ? <span style={{ color: 'var(--blue)' }}>Pro Plan</span>
                : 'Free Plan'
              }
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
              {IS_PRO
                ? 'Renews monthly · Cancel anytime in billing settings'
                : 'Limited to 10 want list slots · No alerts · No price history'
              }
            </div>
          </div>
          {IS_PRO ? (
            <button
              onClick={openBillingPortal}
              disabled={portalLoading}
              style={{
                background: 'none', border: 'none', cursor: portalLoading ? 'not-allowed' : 'pointer',
                color: 'var(--muted)', fontSize: '0.8rem', textDecoration: 'none', padding: 0,
                opacity: portalLoading ? 0.5 : 1,
              }}
            >
              {portalLoading ? 'Loading…' : 'Manage billing →'}
            </button>
          ) : (
            <a href="/pro" style={{
              background: 'var(--blue)', color: '#fff', textDecoration: 'none',
              padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
            }}>
              Upgrade to Pro
            </a>
          )}
        </div>
      </Section>

      {/* Notifications */}
      <Section title={`Notifications${prefsSaving ? ' · saving…' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', opacity: prefsLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <ToggleRow
            label="Deal alert emails"
            description="Email when a want list figure hits your target price"
            enabled={prefs.dealAlerts}
            locked={!IS_PRO}
            lockReason="Pro only"
            onToggle={() => togglePref('dealAlerts')}
          />
          <ToggleRow
            label="Weekly price digest"
            description="Summary of price movements in your want list"
            enabled={prefs.weeklyDigest}
            locked={false}
            onToggle={() => togglePref('weeklyDigest')}
          />
          <ToggleRow
            label="New genre announcements"
            description="When we add new figure genres to FigurePinner"
            enabled={prefs.genreAnnouncements}
            locked={false}
            onToggle={() => togglePref('genreAnnouncements')}
          />
        </div>
      </Section>

      {/* Account — Clerk UserProfile handles email/password/social */}
      <Section title="Account">
        <UserProfile
          appearance={{
            variables: {
              colorBackground: '#181B23',
              colorInputBackground: '#111318',
              colorInputText: '#EEEEF5',
              colorText: '#EEEEF5',
              colorTextSecondary: '#666E8A',
              colorPrimary: '#0066FF',
              colorDanger: '#FF4444',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
            },
            elements: {
              rootBox: { width: '100%' },
              card: { border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'none', background: '#111318' },
              navbar: { display: 'none' },
              pageScrollBox: { padding: '1rem 0' },
            },
          }}
        />
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <div style={{
          padding: '1rem 1.25rem', background: 'rgba(255,68,68,0.05)',
          border: '1px solid rgba(255,68,68,0.2)', borderRadius: '8px',
        }}>
          {!deleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#FF4444' }}>Delete Account</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                  Permanently deletes your account, want list, and collection data. This cannot be undone.
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  background: 'transparent', border: '1px solid rgba(255,68,68,0.4)',
                  color: '#FF4444', cursor: 'pointer', padding: '0.5rem 1rem',
                  borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600',
                  fontFamily: 'var(--font-ui)', flexShrink: 0,
                }}
              >
                Delete Account
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#FF4444' }}>Are you sure?</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                This will permanently delete all your data. Email{' '}
                <a href="mailto:support@figurepinner.com" style={{ color: 'var(--blue)' }}>support@figurepinner.com</a>{' '}
                to request deletion.
              </p>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--muted)', cursor: 'pointer', padding: '0.375rem 0.875rem',
                  borderRadius: '5px', fontSize: '0.8rem', fontFamily: 'var(--font-ui)',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em',
        color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.875rem',
        paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({
  label, description, enabled, locked, lockReason, onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  locked: boolean
  lockReason?: string
  onToggle: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.875rem 0', gap: '1rem',
      borderBottom: '1px solid var(--border)',
      opacity: locked ? 0.6 : 1,
    }}>
      <div>
        <div style={{ fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {label}
          {locked && lockReason && (
            <span style={{
              fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.06em',
              background: 'rgba(0,102,255,0.15)', color: 'var(--blue)',
              padding: '1px 6px', borderRadius: '100px',
            }}>
              {lockReason.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{description}</div>
      </div>
      <button
        onClick={onToggle}
        disabled={locked}
        aria-pressed={enabled}
        title={locked ? `Requires ${lockReason}` : (enabled ? 'Turn off' : 'Turn on')}
        style={{
          width: '40px', height: '22px', borderRadius: '11px', border: 'none',
          background: enabled ? 'var(--blue)' : 'var(--s2)',
          cursor: locked ? 'not-allowed' : 'pointer',
          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: '3px',
          left: enabled ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}
