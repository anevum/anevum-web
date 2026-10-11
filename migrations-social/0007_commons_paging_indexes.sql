-- ANEVUM V5 discussion keyset paging. Separate, unapplied SOCIAL migration.
-- Preserve frozen 0006 bytes; no automatic F0/reviewer/production migration.
-- Apply only with a separately reviewed social-pilot backup/SHA/rollback gate.
PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS commons_v5_posts_published_page
  ON commons_v5_posts(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS commons_v5_replies_paged
  ON commons_v5_replies(post_id, status, created_at ASC, id ASC);
