# ANEVUM V036 — Safe canonical member account closure
Session: ANEVUM.WEB.BUILD.2026-10-16.005.ACCOUNT-CLOSURE
Status: DRAFT SOURCE ONLY. No account deletion, Stripe cancellation, migration, deployment or purchase was performed.
Parent: V035 PR #440; V034 supporter rewards PR #438; V032 payment foundation PR #434.

## Problem
Closing a community account must never erase the canonical member-to-Stripe customer mapping while Stripe could still renew a subscription. Under the present test-only billing integration, the system cannot yet prove that all external payment obligations have been satisfied across a user's entire Stripe customer history.

## Owner privacy design
A deliberately fail-closed self-service closure path is proposed:
- GET /api/v1/member/account-closure: authenticated, private eligibility status only, never a list of another member's payments.
- POST /api/v1/member/account-closure: exact typed confirmation and verified current sign-in email; authenticated via existing Better Auth session, strict same-origin CSRF enforced by canonical Worker.
- Confirm a session independently in canonical MEMBER_DB, created within ten minutes and not expired. A long-lived session cannot authorize deletion merely by clicking a button; reauthenticate first.
- The route remains disabled until CANONICAL_ACCOUNT_CLOSURE_ENABLED=true and the exact canonical MEMBER_DB schema exists, including source-only closure guards.
- A free canonical account with NO Stripe customer mapping, NO subscription, NO Checkout history and NO active Checkout lease may be deleted in one atomic DB statement. Foreign-key cascades remove private profile, sessions, wall, images, and test-earned XP owned by that identity.
- An account with any known Stripe customer, even one with a canceled subscription, MUST use supervised account closure after a separately validated cancellation, invoice, refund and retention review. Do not silently erase the Stripe customer reference.
- Even an expired/abandoned Checkout history blocks self-service deletion; a verified pending remote payment or incomplete webhook should not lose its canonical owner.
- A closure guard is acquired atomically; the Checkout creation guard now checks it in its own atomic SQL. This prevents a concurrent new payable Checkout during account deletion.
- The confirm form lives in /member with a private data export link. While disabled, it shows a clear non-actionable status. Paid accounts get a link to /support billing management instead of a dangerous delete button.
- No route to delete another user, no password/OAuth token, no wallet/credit/currency, no XP or paid awards.

## Separation of responsibilities
The additional guard is in the still-unapplied additive migration 0006. The Worker is not deployed with it. No live ANEVUM account, product, Price or subscription is modified. Any later live release must implement a supervised paid-account closure procedure, ideally cancellation or clear scheduling first, a durable customer support case and financial record retention according to applicable law.

## Acceptance checklist
- [x] Database schema guard committed in source.
- [x] Owner-scoped, recent-auth, explicit-confirmation server closure endpoint implemented.
- [x] Checkout creation guard checks concurrently held closure guard.
- [x] Gated member privacy interface and canonical member data export link implemented.
- [x] Tests for no billing, prior paid customer, checkout history, active lease, stale session, owner isolation and cross-origin requests authored.
- [ ] Pass latest full repository CI at exact branch HEAD.
- [ ] Separately verify actual Better Auth SQLite session createdAt units and expiration against real TEST sessions, after test environment approval.
- [ ] Verify real account deletion cascades and data/export behavior on disposable staging identities, never existing users.
- [ ] Build human-reviewed paid-account deletion and invoice closure procedure with audit retention and confirmed support contact.
- [ ] Approve schema backup, exact D1 migration, and staging release; execute only after explicit owner authorization.
- [ ] Test Stripe Sandbox invoices, cancellations, failed charges, disputes, and pending checkouts end to end.
- [ ] Independently approve LIVE Stripe price activation and production checkout; do not turn test keys into live keys in the staging worker.

**Never merge or deploy V036 automatically, and never delete an account because of an indirect instruction or simulated test outcome.**
