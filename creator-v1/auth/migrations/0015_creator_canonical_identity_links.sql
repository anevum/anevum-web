-- ANEVUM Creator V1 / V012: optional explicit canonical identity links.
-- REVIEW ONLY: not applied to staging, production, V5, or the public site.
-- Only a future verified dual-session, owner-approved workflow may insert rows.
-- Never link by matching email, handle, display name, or user-provided IDs.
CREATE TABLE IF NOT EXISTS creator_canonical_identity_links (
  legacy_member_id TEXT PRIMARY KEY NOT NULL
    REFERENCES member_accounts(id) ON DELETE CASCADE,
  canonical_subject TEXT NOT NULL UNIQUE
    CHECK(length(canonical_subject) BETWEEN 8 AND 128),
  canonical_issuer TEXT NOT NULL
    CHECK(canonical_issuer = 'anevum-better-auth-staging-v1'),
  proof_digest TEXT NOT NULL UNIQUE
    CHECK(length(proof_digest) = 64),
  status TEXT NOT NULL DEFAULT 'verified'
    CHECK(status IN ('verified', 'revoked')),
  verified_at INTEGER NOT NULL CHECK(verified_at > 0),
  reviewed_at INTEGER NOT NULL CHECK(reviewed_at > 0),
  revoked_at INTEGER,
  CHECK (
    (status = 'verified' AND revoked_at IS NULL) OR
    (status = 'revoked' AND revoked_at IS NOT NULL AND revoked_at >= verified_at)
  )
);
CREATE INDEX IF NOT EXISTS idx_creator_canonical_links_subject
  ON creator_canonical_identity_links(canonical_subject,status);

INSERT OR IGNORE INTO schema_migrations(version)
VALUES('0015_creator_canonical_identity_links');
