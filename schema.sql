-- D1 数据库表结构。一次性执行：
--   wrangler d1 execute bj-housing --file=schema.sql --remote
-- 或在 Cloudflare 控制台 D1 → Console 里粘贴执行

CREATE TABLE IF NOT EXISTS rentals (
  id          TEXT PRIMARY KEY,
  mode        TEXT NOT NULL DEFAULT 'rent',  -- 'rent' | 'buy'
  title       TEXT,
  price       REAL,
  unitPrice   REAL,
  area        REAL,
  layout      TEXT,
  orient      TEXT,
  addr        TEXT,
  description TEXT,
  contact     TEXT,
  lng         REAL NOT NULL,
  lat         REAL NOT NULL,
  images      TEXT NOT NULL DEFAULT '[]',    -- JSON array, e.g. ["r2:abc.jpg"]
  videos      TEXT NOT NULL DEFAULT '[]',
  createdAt   TEXT,
  updatedAt   TEXT
);

CREATE INDEX IF NOT EXISTS idx_rentals_mode ON rentals(mode);
CREATE INDEX IF NOT EXISTS idx_rentals_updated ON rentals(updatedAt DESC);
