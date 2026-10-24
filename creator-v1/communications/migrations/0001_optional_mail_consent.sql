-- ANEVUM IREN: separate optional communications database (NOT MEMBER_DB).
-- Source-only migration. No production or staging D1 has been modified.
-- Apply only to a NEW, reviewed D1 instance, after backup/owner approval.
CREATE TABLE IF NOT EXISTS communication_manifest (
 id INTEGER PRIMARY KEY CHECK (id=1),
 issuer TEXT NOT NULL CHECK (issuer='anevum-communications-v1'),
 version TEXT NOT NULL CHECK (version='0001_optional_mail_consent')
);
INSERT OR IGNORE INTO communication_manifest(id,issuer,version)
VALUES(1,'anevum-communications-v1','0001_optional_mail_consent');

CREATE TABLE IF NOT EXISTS communication_subscribers (
 id TEXT PRIMARY KEY NOT NULL,
 email TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(email) BETWEEN 6 AND 254),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','unsubscribed')),
 releases INTEGER NOT NULL DEFAULT 0 CHECK(releases IN (0,1)),
 weekly INTEGER NOT NULL DEFAULT 0 CHECK(weekly IN (0,1)),
 pending_releases INTEGER NOT NULL DEFAULT 0 CHECK(pending_releases IN (0,1)),
 pending_weekly INTEGER NOT NULL DEFAULT 0 CHECK(pending_weekly IN (0,1)),
 confirm_hash TEXT UNIQUE CHECK(confirm_hash IS NULL OR length(confirm_hash)=64),
 confirm_expires_at INTEGER,
 unsub_version INTEGER NOT NULL DEFAULT 1 CHECK(unsub_version>0),
 manage_hash TEXT UNIQUE CHECK(manage_hash IS NULL OR length(manage_hash)=64),
 manage_expires_at INTEGER,
 consent_version TEXT CHECK(consent_version IS NULL OR consent_version='v1'),
 consent_source TEXT CHECK(consent_source IS NULL OR consent_source='site-optin-v1'),
 consent_at INTEGER,
 confirmed_at INTEGER,
 unsubscribed_at INTEGER,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 CHECK(confirm_hash IS NULL OR (confirm_expires_at IS NOT NULL AND (pending_releases=1 OR pending_weekly=1))),
 CHECK(status!='confirmed' OR releases=1 OR weekly=1)
);
CREATE INDEX IF NOT EXISTS communication_subscribers_digest
 ON communication_subscribers(status,weekly,updated_at);
CREATE INDEX IF NOT EXISTS communication_subscribers_release
 ON communication_subscribers(status,releases,updated_at);

CREATE TABLE IF NOT EXISTS communication_consent_log (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 subscriber_id TEXT NOT NULL REFERENCES communication_subscribers(id),
 event TEXT NOT NULL CHECK(event IN ('optin-requested','confirmed','preferences-disabled','unsubscribed')),
 occurred_at INTEGER NOT NULL,
 consent_version TEXT,
 consent_source TEXT
);
CREATE INDEX IF NOT EXISTS communication_consent_log_subscriber
 ON communication_consent_log(subscriber_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS communication_rate_windows (
 bucket TEXT PRIMARY KEY NOT NULL CHECK(length(bucket) BETWEEN 6 AND 140),
 hits INTEGER NOT NULL DEFAULT 0 CHECK(hits>=0),
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS communication_rate_windows_expiry
 ON communication_rate_windows(expires_at);

-- D1 triggers make opt-in/reconfirmation and suppression audit inserts atomic
-- with the corresponding subscriber state transitions.
CREATE TRIGGER IF NOT EXISTS communication_requested_insert
AFTER INSERT ON communication_subscribers
WHEN NEW.confirm_hash IS NOT NULL
BEGIN
 INSERT INTO communication_consent_log(subscriber_id,event,occurred_at,consent_version,consent_source)
 VALUES(NEW.id,'optin-requested',NEW.consent_at,NEW.consent_version,NEW.consent_source);
END;
CREATE TRIGGER IF NOT EXISTS communication_requested_update
AFTER UPDATE OF confirm_hash ON communication_subscribers
WHEN NEW.confirm_hash IS NOT NULL AND (OLD.confirm_hash IS NULL OR OLD.confirm_hash!=NEW.confirm_hash)
BEGIN
 INSERT INTO communication_consent_log(subscriber_id,event,occurred_at,consent_version,consent_source)
 VALUES(NEW.id,'optin-requested',NEW.consent_at,NEW.consent_version,NEW.consent_source);
END;
CREATE TRIGGER IF NOT EXISTS communication_confirmed_update
AFTER UPDATE OF confirm_hash ON communication_subscribers
WHEN OLD.confirm_hash IS NOT NULL AND NEW.confirm_hash IS NULL AND NEW.status='confirmed'
BEGIN
 INSERT INTO communication_consent_log(subscriber_id,event,occurred_at,consent_version,consent_source)
 VALUES(NEW.id,'confirmed',NEW.confirmed_at,NEW.consent_version,NEW.consent_source);
END;
CREATE TRIGGER IF NOT EXISTS communication_disabled_update
AFTER UPDATE OF releases,weekly,status ON communication_subscribers
WHEN OLD.status='confirmed' AND (NEW.releases!=OLD.releases OR NEW.weekly!=OLD.weekly)
 AND NEW.status='confirmed'
BEGIN
 INSERT INTO communication_consent_log(subscriber_id,event,occurred_at,consent_version,consent_source)
 VALUES(NEW.id,'preferences-disabled',NEW.updated_at,NEW.consent_version,NEW.consent_source);
END;
CREATE TRIGGER IF NOT EXISTS communication_unsubscribed_update
AFTER UPDATE OF status ON communication_subscribers
WHEN OLD.status='confirmed' AND NEW.status='unsubscribed'
BEGIN
 INSERT INTO communication_consent_log(subscriber_id,event,occurred_at,consent_version,consent_source)
 VALUES(NEW.id,'unsubscribed',NEW.unsubscribed_at,NEW.consent_version,NEW.consent_source);
END;
