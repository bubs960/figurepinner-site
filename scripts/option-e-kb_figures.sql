-- Option E KB catalog table for D1.
--
-- This DB is intentionally separate from figurepinner-userdata. The KB can be
-- rebuilt wholesale from src/data/figures-reference-v2.slim.js, while user data
-- must never be dropped during a catalog refresh.

DROP TABLE IF EXISTS kb_figures;

CREATE TABLE kb_figures (
  figure_id TEXT PRIMARY KEY NOT NULL,
  fandom TEXT NOT NULL,
  character_canonical TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  product_line TEXT NOT NULL,
  sub_fandom TEXT,
  character_variant TEXT,
  release_wave TEXT,
  scale TEXT,
  pack_size TEXT,
  exclusive_to TEXT,
  canonical_image_url TEXT,
  name TEXT,
  v1_name TEXT,
  v1_line TEXT,
  v1_series TEXT,
  match_represented TEXT,
  key_features TEXT,
  -- passport: v4.2 evidence-locked claims block (matcher pour schema 2026-08-13), stored as the
  -- JSON text of the slim KB object; NULL when the figure has none. Added 2026-09-23 (standalone
  -- ruling STANDALONE-TO-MATCHER-WEB-SCALE-PASSPORT-DECISION-2026-09-21, option a).
  passport TEXT
);

CREATE INDEX idx_kb_figures_fandom
  ON kb_figures (fandom);

CREATE INDEX idx_kb_figures_fandom_line
  ON kb_figures (fandom, product_line);

CREATE INDEX idx_kb_figures_pretty_url
  ON kb_figures (fandom, product_line, character_canonical);

CREATE INDEX idx_kb_figures_character
  ON kb_figures (character_canonical);

-- release_wave LEADS on purpose: only a query that constrains release_wave can
-- use this index, so no fandom/line read changes plan. waveCompanions (every
-- figure page) otherwise range-scans the whole line: measured 2026-09-22
-- (wrangler d1 insights) 405 rows/call, 43% of all D1 rows read.
CREATE INDEX idx_kb_figures_line_wave
  ON kb_figures (release_wave, fandom, product_line);
