# ANEVUM progression reset — 2026-10-21

Session: ANEVUM.OPS.MAINT.2026-10-21.001.PROGRESSION-RESET

## Confirmed inventory (read-only)
- Canonical account database: `anevum-canonical-member-staging` (verify the **live** Worker binding before any production mutation).
- 6 users, 1,783 `member_xp_events`, 7 `member_space_milestones`, 30 `member_reward_notifications`, 3 `member_recognition_grants` at inspection time.
- Separate `anevum-creator-v1-staging` database: 0 `community_xp_events` at inspection time.
- Canonical `member_xp_events.source` is constrained to `test_button`. The live schema has no `member_xp_totals` table.
- Cloudflare D1 scoped export completed at bookmark `00000343-00000000-0000510b-b0881d1d7f29e7fc4794f0ba138b8885` for XP events, milestones, notifications and receipts. This is not yet a durable, independently tested recovery artifact.

## Non-negotiable gates
1. Verify the canonical production Worker uses this exact D1 database, and ensure all XP-test writes are disabled in the live worker environment. Disable public/staff test controls without removing ordinary XP read APIs.
2. Download the D1 export into **secured** operator-managed backup storage, verify hash/rows and test restoration against a disposable D1 database. Take an additional fresh pre-write backup at cutover.
3. Review that no users have acquired contractual/redeemable entitlements based on XP; preserve recognition grants, supporter status, memberships, payment and content records.
4. Stop writes / choose an application maintenance gate. Execute the whole reset atomically with before/after counts and rollback on any mismatch. Do not apply the SQL fragments individually in production.
5. Validate every account reads `XP = 0` / `level = 1` through the member API and protected media inventory; verify no stale level assets and no repeated test grants.
6. Re-enable eligible organic XP flows **only** after the new earning rules are approved.

## Candidate transactional reset scope (DO NOT RUN before gates)
```sql
-- Only canonical progression XP and earned-progression milestone records.
-- Test-derived XP events are homogeneous: source CHECK(source='test_button').
DELETE FROM member_xp_events;
DELETE FROM member_space_milestones;
-- Clear progression-generated level announcements and only matching
-- milestone award announcements; preserve unrelated recognition notifications.
DELETE FROM member_reward_notifications
WHERE kind='level' OR (kind='award' AND reference IN ('first_signal','world_shaper'));
-- Do not touch member_notification_receipts: it tracks the highest delivered
-- notification ID and is not an XP balance.
```

The separate `community_xp_events` ledger has zero rows at last read. Recheck it at execution, and reset only if explicitly aligned with the approved common XP epoch. The `member_recognition_grants`, `member_recognition_preferences`, supporter records, identities, sessions, staff grants, content and payments must remain intact.

## Important follow-up
The canonical `readProgression()` derives XP from milestone rows plus test XP rows. Removing both resets computed XP and levels to 0/1. Later profile changes may re-earn first-signal/world-shaper milestones under existing behavior. A new epoch/version or milestone-generation pause may be necessary for a strict launch reset.

The Observatory PR removes synthetic XP counters from UI and SQL, but does not deploy itself or authorize a live reset.
