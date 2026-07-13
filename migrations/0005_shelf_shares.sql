-- Claiming Ritual Phase C ("Share My Shelf"). One row per user who has ever
-- clicked Share -- a stable, reusable, unguessable share token so the same
-- link always works and always reflects the user's CURRENT shelf (the token
-- maps to a user, the card renders live counts on each fetch, never a frozen
-- snapshot). token is a random crypto.randomUUID() -- never the user_id
-- itself, so a share link can't be used to enumerate/guess accounts.
--
-- NOT YET APPLIED to prod -- author only, per this repo's D1 discipline
-- (Steve/CF MCP applies migrations; see wrangler.toml's [[d1_databases]]
-- comment on prior migrations for the same pattern).
CREATE TABLE IF NOT EXISTS shelf_shares (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shelf_shares_user ON shelf_shares (user_id);
