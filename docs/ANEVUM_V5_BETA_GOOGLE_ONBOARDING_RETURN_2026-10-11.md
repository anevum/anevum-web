# ANEVUM V5 — beta Google signup return

Session: ANEVUM.WEB.BUILD.2026-10-11.009.SIGNUP-TO-BETA-CHECKLIST
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Incremental parent: draft WEB #302 at c1d498e29d9272e095f84fe8b28976ecdc25ed49.

This V5 visitor flow now begins at public /beta, proceeds to Google account registration via /sign-in?next=beta, and returns the newly authenticated member to /me/beta rather than silently diverting them to the generic Command homepage.

The standard /sign-in route remains directed to /command. The client never accepts user-provided post-login URLs. The ONLY optional query value is the exact token next=beta, which is mapped to the literal same-origin path /me/beta. Invalid URL-looking, protocol-relative, broker-terminal, script-scheme and malformed values all map back to /command. A signed-in visitor on the login screen sees the same safe intended destination.

The account/checklist response remains tied to verified Better Auth identity. Normal registration does not grant an Alpaca connection, order execution, rewards, account funding, public discussion posting or founder operator rights. The separate owner PAPER observer remains disabled. The public /beta route advertises real research regardless of whether Google signup is available.

The new test suite checks allowed and rejected redirect intents, exact client routing, and unchanged broker/community gates. This is source-only development; no OAuth client credentials, provider settings, production Worker, D1 migration or public release was modified.

Remaining real acceptance: first-time Google login, session return and cookie persistence, second independent member and private data isolation, protected owner binding and an independently authorized production beta release. Alpaca Connect review is NOT a prerequisite for this non-trading registration flow.
