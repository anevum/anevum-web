# ANEVUM — One-time progression maintenance

Session: `ANEVUM.OPS.MAINT.2026-10-22.001.FINAL-XP-RESET`

This maintenance-only workflow belongs on the default branch. Application changes remain on the approved release branch and follow their separate release controls.

Pull requests run offline synthetic tests only. Production maintenance is manual, pinned to an exact reviewed commit, and restricted to the repository owner. Execute uses the protected `production-progression-reset` environment with required reviewers and main-only deployment branches. Never weaken those protections to complete a reset.

Prepare must complete successfully before Execute. It creates an encrypted external backup, downloads the stored artifact, and restores it in isolated SQLite with integrity and foreign-key checks. Recovery material and credentials must remain private; store the decryption key separately. Do not publish plaintext exports, keys, member identifiers, or private recovery instructions.

Execute requires the successful Prepare run, its ledger digest, matching current state, a fresh encrypted and independently restored recovery artifact, and environment approval. State drift fails closed. The transaction removes only synthetic XP, progression milestones, and their derived notifications. Independent recognition, notification receipts, identities, sessions, roles, supporter entitlements, published content, and payments are preserved.

A successful reset must report zero XP and progression milestones, preserved recognition and receipts, and a legacy XP write blocker. Verify every current member derives Level 1 and obsolete rewards disappear. Separately retire the test endpoint and feature flag through the approved web release process while retaining production bindings, secrets, routes, and unrelated features.

If execution becomes inconclusive, do not retry the destructive stage. Inspect the receipt and read-only counts, then use a separately reviewed recovery operation if needed. Retain encrypted recovery artifacts according to the configured retention policy. Private operator configuration, exact resource inventory, and recovery custody records are maintained outside this public runbook.
