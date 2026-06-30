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
  key_features TEXT
);

CREATE INDEX idx_kb_figures_fandom
  ON kb_figures (fandom);

CREATE INDEX idx_kb_figures_fandom_line
  ON kb_figures (fandom, product_line);

CREATE INDEX idx_kb_figures_pretty_url
  ON kb_figures (fandom, product_line, character_canonical);

CREATE INDEX idx_kb_figures_character
  ON kb_figures (character_canonical);
