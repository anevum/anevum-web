-- CristyBreathe calendar V1. Additive; no changes to existing personal entries.
CREATE TABLE IF NOT EXISTS calendar_events (
 id TEXT PRIMARY KEY,
 owner TEXT NOT NULL,
 title TEXT NOT NULL,
 details TEXT NOT NULL DEFAULT '',
 location TEXT NOT NULL DEFAULT '',
 all_day INTEGER NOT NULL DEFAULT 0 CHECK(all_day IN (0,1)),
 start_date TEXT NOT NULL DEFAULT '',
 end_date TEXT NOT NULL DEFAULT '',
 starts_at TEXT NOT NULL DEFAULT '',
 ends_at TEXT NOT NULL DEFAULT '',
 time_zone TEXT NOT NULL DEFAULT 'UTC',
 status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
 revision INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS calendar_events_timed ON calendar_events(owner, status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS calendar_events_allday ON calendar_events(owner, status, start_date, end_date);
CREATE INDEX IF NOT EXISTS entries_owner_due_calendar ON entries(owner, kind, archived, is_draft, due_date);
