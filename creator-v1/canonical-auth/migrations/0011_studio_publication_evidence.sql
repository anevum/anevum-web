-- ANEVUM.WEB.BUILD.2026-10-17.019.CREATION-AWARDS-RELEASE-EVIDENCE
-- SOURCE ONLY, NOT AN AUTOMATIC PRODUCTION MIGRATION.
-- Run against a backed-up canonical MEMBER_DB after explicit public-release
-- review. No files become public, executable, or scan-cleared by this DDL.
-- Compatible with immutable PRIVATE Studio V050 snapshots and V069 recognition.
PRAGMA foreign_keys=ON;

-- Consent is scoped to ONE frozen submission, never a mutable project draft.
-- Consent may be withdrawn; public queries check that every time.
CREATE TABLE IF NOT EXISTS member_studio_publication_consents(
 submission_id TEXT PRIMARY KEY NOT NULL
  REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL
  REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 scope TEXT NOT NULL DEFAULT 'external_metadata_only'
  CHECK(scope='external_metadata_only'),
 consented_at INTEGER NOT NULL CHECK(consented_at>0),
 revoked_at INTEGER CHECK(revoked_at IS NULL OR revoked_at>=consented_at),
 UNIQUE(project_id,submission_id)
);
CREATE INDEX IF NOT EXISTS idx_studio_publication_consent_owner
 ON member_studio_publication_consents(user_id,consented_at DESC);

-- An independent human reviewer must attest to metadata/content, permissions
-- and an external HTTPS destination. These flags are NOT automatic malware
-- scans and NEVER authorize serving quarantined uploads.
CREATE TABLE IF NOT EXISTS member_studio_publication_reviews(
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 submission_id TEXT NOT NULL UNIQUE
  REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL
  REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 reviewer_id TEXT NOT NULL, -- stable audit key; account deletion must not be blocked
 owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 action TEXT NOT NULL DEFAULT 'publish_metadata'
  CHECK(action='publish_metadata'),
 rights_checked INTEGER NOT NULL CHECK(rights_checked=1),
 content_checked INTEGER NOT NULL CHECK(content_checked=1),
 external_link_checked INTEGER NOT NULL CHECK(external_link_checked=1),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 25 AND 1200),
 reviewed_at INTEGER NOT NULL CHECK(reviewed_at>0),
 CHECK(reviewer_id<>owner_id)
);
CREATE INDEX IF NOT EXISTS idx_studio_publication_review_project
 ON member_studio_publication_reviews(project_id,reviewed_at DESC);

-- A public listing represents only reviewed EXTERNAL metadata. No R2 object
-- key, attachment ID, package URL or binary content is stored or exposed.
CREATE TABLE IF NOT EXISTS member_studio_publications(
 project_id TEXT PRIMARY KEY NOT NULL
  REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 submission_id TEXT NOT NULL UNIQUE
  REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 review_id TEXT NOT NULL UNIQUE
  REFERENCES member_studio_publication_reviews(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'published'
  CHECK(status IN ('published','withdrawn')),
 published_at INTEGER NOT NULL CHECK(published_at>0),
 withdrawn_at INTEGER CHECK(withdrawn_at IS NULL OR withdrawn_at>=published_at),
 CHECK((status='published' AND withdrawn_at IS NULL)
       OR (status='withdrawn' AND withdrawn_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_studio_publications_visible
 ON member_studio_publications(status,published_at DESC,project_id);
CREATE INDEX IF NOT EXISTS idx_studio_publications_author
 ON member_studio_publications(user_id,status,published_at DESC);

-- Claim a normalized external work URL once per owner, so changing
-- a project slug or adding tracking parameters cannot farm publication badges.
-- Stored internal normalization keys are NEVER projected to public callers.
CREATE TABLE IF NOT EXISTS member_studio_publication_links(
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 canonical_link TEXT NOT NULL CHECK(length(canonical_link) BETWEEN 8 AND 1500),
 project_id TEXT NOT NULL UNIQUE
  REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,canonical_link)
);
CREATE INDEX IF NOT EXISTS idx_studio_publication_links_project
 ON member_studio_publication_links(project_id);

-- Deliberately NO trigger granting XP or marks for a submission, quarantine
-- upload, staff role or review click. Grants require one verified published
-- ledger row, author consent and an independent audit, all in the same batch.
