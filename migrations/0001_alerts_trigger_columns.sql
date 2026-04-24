-- Migration: add alert delivery tracking columns
-- Run with: npx wrangler d1 execute figurepinner-userdata --remote --file=migrations/0001_alerts_trigger_columns.sql

ALTER TABLE alerts ADD COLUMN last_triggered_at TEXT;      -- ISO-8601 timestamp of last email sent
ALTER TABLE alerts ADD COLUMN last_sent_price REAL;        -- price that triggered the last send
