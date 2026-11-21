CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  moderated_at TEXT
);

CREATE INDEX reviews_status_date ON reviews (status, created_at DESC);
