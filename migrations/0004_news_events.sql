-- News / events log. Used by /api/admin/news (POST) and /api/news (GET).
-- Stores release announcements, license news, recall events, etc. — feed of
-- collector-relevant updates we surface on /news and (eventually) on figure
-- detail pages.
--
-- Already applied to prod via CF MCP on 2026-04-25.
CREATE TABLE IF NOT EXISTS news_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,                                              -- short description, markdown allowed
  url TEXT,                                               -- external source link (optional)
  genre TEXT,                                             -- wrestling/marvel/etc, nullable
  figure_id TEXT,                                         -- link to specific figure, nullable
  pinned INTEGER NOT NULL DEFAULT 0,                      -- 0 or 1; pinned items render first
  published_at TEXT NOT NULL DEFAULT (datetime('now')),   -- can be future for scheduled
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_events (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_genre     ON news_events (genre);
CREATE INDEX IF NOT EXISTS idx_news_figure    ON news_events (figure_id);
CREATE INDEX IF NOT EXISTS idx_news_pinned    ON news_events (pinned, published_at DESC);
