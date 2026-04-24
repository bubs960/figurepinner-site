-- Migration: soft-delete status on vault/wantlist + devices table for push tokens
-- Run with: npx wrangler d1 execute figurepinner-userdata --remote --file=migrations/0002_soft_delete_and_devices.sql

-- ── Soft-delete for vault_items ──────────────────────────────────────────────
-- status: 'active' | 'removed'  (default 'active')
ALTER TABLE vault_items ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- ── Soft-delete for wantlist_items ───────────────────────────────────────────
ALTER TABLE wantlist_items ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- ── Devices table for push token registration ─────────────────────────────────
-- One row per (user_id, token) pair. platform: 'ios' | 'android' | 'web'
-- Upsert on conflict(user_id, token) replaces updated_at.
CREATE TABLE IF NOT EXISTS devices (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  token       TEXT    NOT NULL,
  platform    TEXT    NOT NULL DEFAULT 'ios',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
