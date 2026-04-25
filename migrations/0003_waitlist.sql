-- Waitlist email signups from /coming-soon and any other public form.
-- Email is unique to prevent double-signups; source tracks where the signup
-- originated so we can later attribute conversion (coming_soon vs blog vs
-- referral campaign).
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  source      TEXT DEFAULT 'coming_soon',
  ip_hash     TEXT,                                       -- SHA-256 of IP, for soft rate-limit
  user_agent  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_signups (created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_source     ON waitlist_signups (source);
