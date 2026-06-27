-- Database setup for Social Poster
-- Run: wrangler d1 execute social-posts-db --file=setup_db.sql

-- Posts queue
CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  figure_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subreddit TEXT NOT NULL DEFAULT 'ActionFigures',
  image_url TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'posted', 'failed')),
  scheduled_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  posted_at DATETIME,
  error_message TEXT,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_time),
  INDEX idx_figure (figure_id)
);

-- Posting history
CREATE TABLE IF NOT EXISTS post_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  figure_id TEXT,
  platform TEXT NOT NULL, -- 'reddit', 'twitter', etc.
  subreddit TEXT,
  
  -- Post details
  title TEXT,
  url TEXT, -- Link to the posted content
  score INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  
  -- Tracking
  posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_checked DATETIME,
  
  -- Foreign key
  FOREIGN KEY (post_id) REFERENCES social_posts(id),
  
  -- Indexes
  INDEX idx_posted (posted_at),
  INDEX idx_platform (platform)
);

-- Figure metadata cache (optional - can pull from your main DB)
CREATE TABLE IF NOT EXISTS figure_cache (
  figure_id TEXT PRIMARY KEY,
  v1_name TEXT NOT NULL,
  fandom TEXT NOT NULL,
  manufacturer TEXT,
  product_line TEXT,
  year INTEGER,
  image_url TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config
INSERT OR IGNORE INTO config (key, value) VALUES
  ('posting_enabled', 'true'),
  ('daily_limit', '1'),
  ('default_subreddit', 'ActionFigures'),
  ('last_run', ''),
  ('next_scheduled', '');

-- Views for easier querying
CREATE VIEW IF NOT EXISTS pending_posts AS
SELECT * FROM social_posts 
WHERE status = 'pending' 
  AND (scheduled_time IS NULL OR scheduled_time <= CURRENT_TIMESTAMP)
ORDER BY scheduled_time ASC, created_at ASC;

CREATE VIEW IF NOT EXISTS today_posts AS
SELECT * FROM social_posts 
WHERE DATE(posted_at) = DATE('now')
ORDER BY posted_at DESC;

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_social_posts_timestamp 
AFTER UPDATE ON social_posts
BEGIN
  UPDATE social_posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Sample data for testing
INSERT OR IGNORE INTO social_posts (figure_id, title, content, subreddit, status) VALUES
  ('fp_wrestling_jakks-pacific_deluxe-aggression_1_batista_007d1b', 
   'Test WWE Figure: Batista Deluxe Aggression',
   'Testing the social poster system with a classic WWE figure.',
   'test',
   'pending'),
  ('fp_wrestling_jakks-pacific_deluxe-aggression_1_john-cena_1ec6e8',
   'Test WWE Figure: John Cena Deluxe Aggression',
   'Another test post for the automation system.',
   'test',
   'pending');

-- Create a view for worker to get next post
CREATE VIEW IF NOT EXISTS next_post AS
SELECT * FROM pending_posts LIMIT 1;

PRAGMA user_version = 1;