-- EXPERIMENT ONLY. Not in the migration directory; not installed or routed.
-- Evidence must be authored by future trusted source adapters, never clients.
PRAGMA foreign_keys=ON;
CREATE TABLE next_xp_evidence (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('review','bug','thread','reply','project','release')),
 subject TEXT NOT NULL CHECK(length(subject) BETWEEN 1 AND 160),
 scope TEXT NOT NULL CHECK(length(scope) BETWEEN 1 AND 160),
 owner_id TEXT NOT NULL REFERENCES "user"(id),
 reviewer_id TEXT NOT NULL REFERENCES "user"(id),
 status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
 approved_at INTEGER NOT NULL CHECK(approved_at>=0)
);
CREATE TABLE next_xp_grants (
 id TEXT PRIMARY KEY REFERENCES next_xp_evidence(id),
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, subject TEXT NOT NULL, scope TEXT NOT NULL,
 points INTEGER NOT NULL CHECK(points IN (15,20,25,30,60,100,150)),
 policy TEXT NOT NULL CHECK(policy='continuance-candidate-1'),
 awarded_at INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0), last_decision TEXT,
 UNIQUE(user_id,kind,subject)
);
CREATE INDEX next_xp_caps ON next_xp_grants(user_id,kind,awarded_at);
CREATE UNIQUE INDEX next_xp_firsts ON next_xp_grants(user_id,kind) WHERE kind IN ('thread','reply');
CREATE TABLE next_xp_decisions (
 id TEXT PRIMARY KEY, grant_id TEXT NOT NULL REFERENCES next_xp_grants(id) ON DELETE CASCADE,
 reviewer_id TEXT NOT NULL REFERENCES "user"(id),
 action TEXT NOT NULL CHECK(action IN ('revoke','restore')),
 reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 8 AND 500),
 reviewed_at INTEGER NOT NULL CHECK(reviewed_at>0),
 expected_revision INTEGER NOT NULL CHECK(expected_revision>0)
);
CREATE TABLE next_xp_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 grant_id TEXT NOT NULL REFERENCES next_xp_grants(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL, delta INTEGER NOT NULL,
 decision_id TEXT UNIQUE REFERENCES next_xp_decisions(id),
 created_at INTEGER NOT NULL, UNIQUE(grant_id,revision)
);
CREATE INDEX next_xp_history ON next_xp_events(user_id,id);
CREATE TRIGGER next_xp_granted AFTER INSERT ON next_xp_grants BEGIN
 INSERT INTO next_xp_events(grant_id,user_id,revision,delta,created_at)
 VALUES(NEW.id,NEW.user_id,1,NEW.points,NEW.awarded_at);
END;
CREATE TRIGGER next_xp_grant_guard BEFORE UPDATE ON next_xp_grants BEGIN
 SELECT CASE WHEN NEW.id<>OLD.id OR NEW.user_id<>OLD.user_id OR NEW.kind<>OLD.kind
 OR NEW.subject<>OLD.subject OR NEW.scope<>OLD.scope OR NEW.points<>OLD.points OR NEW.policy<>OLD.policy
 OR NEW.awarded_at<>OLD.awarded_at OR NEW.revision<>OLD.revision+1 OR NEW.active=OLD.active
 OR NEW.last_decision IS NULL THEN RAISE(ABORT,'Invalid grant transition') END;
END;
CREATE TRIGGER next_xp_transitioned AFTER UPDATE ON next_xp_grants BEGIN
 INSERT INTO next_xp_events(grant_id,user_id,revision,delta,decision_id,created_at)
 VALUES(NEW.id,NEW.user_id,NEW.revision,CASE WHEN NEW.active=1 THEN NEW.points ELSE -NEW.points END,
 NEW.last_decision,(SELECT reviewed_at FROM next_xp_decisions WHERE id=NEW.last_decision));
END;
CREATE TRIGGER next_xp_event_immutable BEFORE UPDATE ON next_xp_events BEGIN
 SELECT RAISE(ABORT,'XP history is append-only');
END;
CREATE TRIGGER next_xp_evidence_immutable BEFORE UPDATE ON next_xp_evidence BEGIN
 SELECT RAISE(ABORT,'Evidence is immutable');
END;
CREATE TRIGGER next_xp_decision_immutable BEFORE UPDATE ON next_xp_decisions BEGIN
 SELECT RAISE(ABORT,'Decision is immutable');
END;
