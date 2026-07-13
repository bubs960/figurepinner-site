-- Daily Grail Spotlight (W3, WEBAUDIT-FINAL-CYCLE-PLAN-2026-07-12.md §3 #2).
-- One row per calendar date (UTC), written ONCE the first time /today is
-- requested that day, never overwritten after. This is what makes the
-- archive (/today/[date]) stable: without a stored record, re-deriving a
-- past date's pick against CURRENT R2 sold-comp data would silently show a
-- different figure than what was actually spotlighted that day (the
-- 90-day trend windows are relative to "now", which keeps moving).
--
-- NOT YET APPLIED to prod -- author only, same pattern as every prior
-- migration in this repo (Steve/CF MCP applies).
CREATE TABLE IF NOT EXISTS daily_spotlight (
  date TEXT PRIMARY KEY,        -- 'YYYY-MM-DD', UTC
  figure_id TEXT NOT NULL,
  trend_pct REAL NOT NULL,      -- the real computeTrend() value that won the day, kept for the archive page's own copy
  comp_count INTEGER NOT NULL,
  computed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
